import Project from "./Project.mjs"
import Group from "../Group/Group.mjs"
import User from "../User/User.mjs"
import dbDriver from "../../database/driver.mjs"
import fs from "fs"
import path from "path"
const database = new dbDriver("mongo")

export default class ProjectFactory {
  constructor(data) {
    this.data = data
  }

  static async loadManifest(url) {
    return fetch(url)
      .then((response) => {
        return response.json()
      })
      .catch((err) => {
        throw {
          status: err.status ?? 404,
          message: err.message ?? "Manifest not found. Please check URL"
        }
      })
  }
  /**
   * processes a manifest object into a project object that can be saved into the Project tablein the DB
   * @param {*} manifest : The manifest object to be processed
   * @returns object of project data
   */
  static async DBObjectFromManifest(manifest) {
     if (!manifest) {
      throw {
        status: 404,
        message: err.message ?? "No manifest found. Cannot process empty object"
      }
    }
    let newProject = {}
    newProject.label = ProjectFactory.processLabel(manifest.label)
    newProject.metadata = manifest.metadata
    newProject.manifest = manifest["@id"] ?? manifest.id
    let canvas = manifest.items ?? manifest?.sequences[0]?.canvases
    newProject.layers = await ProjectFactory.processLayerFromCanvas(canvas)
    return newProject
  }

  static processLabel(label) {
    let processedLabel = null
    if (typeof (label) == "string") {
      processedLabel = label
    }

    else if (typeof (label) == "object" && label != null) {
      //for language maps
      let firstKey = Object.keys(label)[0]
      processedLabel = label[firstKey]
      if (Array.isArray(processedLabel)) processedLabel = processedLabel[0]
    }

    return processedLabel
  }
  static async processLayerFromCanvas(canvases) {
    if (!canvases.length) return []

    let layers = []

    try {
      canvases.map(async (canvas) => {
        let layer = {}
        layer["@id"] = Date.now()
        layer["@type"] = "Layer"
        layer.pages = canvas?.otherContent ?? canvas?.annotations ?? []
        layer?.pages?.map((page) => {
          page.canvas = page.on ?? canvas.id
          page.lines = page.resources ?? page.items ?? []
          delete page.resources
          delete page.on
          delete page.items
        })

        layers.push(layer)
      })
    } catch (error) {
      console.log(error)
    }
    return layers
  }

  static async fromManifestURL(manifestId, creator) {
    return ProjectFactory.loadManifest(manifestId)
      .then(async (manifest) => {
        return await ProjectFactory.DBObjectFromManifest(manifest)
      })
      .then(async (project) => {
        const projectObj = new Project()
        const group = await Group.createNewGroup(
          creator,
          {
            label: project.label ?? project.title ?? `Project ${new Date().toLocaleDateString()}`,
            members: { [creator]: { roles: [] } }
          })
          .then((group) => group._id)
        return await projectObj.create({ ...project, creator, group })
      })
      .catch((err) => {
        throw {
          status: err.status ?? 500,
          message: err.message ?? "Internal Server Error"
        }
      })
  }

  /**
   * Convert the Project.data into an Object ready for consumption by a TPEN interface,
   * especially the GET /project/:id endpoint.
   * @param {Object} projectData The loaded Project.data from the database.
   */
  static async forInterface(projectData) {
    if (!projectData) {
      const err = new Error("No project data found")
      err.status = 400
      throw err
    }
    const project = {
      _id: projectData._id,
      label: projectData.label,
      metadata: projectData.metadata ?? [],
      layers: projectData.layers ?? [],
      manifest: projectData.manifest,
      creator: projectData.creator,
      collaborators: {},
      license: projectData.license,
      tools: projectData.tools,
      options: projectData.options,
      roles: Object.assign(Group.defaultRoles, projectData.customRoles)
    }

    const group = new Group(projectData.group)
    await group.getMembers()
      .then(members => {
        const loadMembers = []
        Object.keys(members).forEach(memberId => {
          project.collaborators[memberId] = {
            roles: members[memberId]
          }
          loadMembers.push(new User(memberId).getPublicInfo().then(profile => {
            project.collaborators[memberId].profile = profile
          }))
        })
        return Promise.all(loadMembers)
      })

    return project
  }

  static async exportManifest(projectId) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }
    let manifest = {}
    const project = await ProjectFactory.loadAsUser(projectId, null)
    const dir = `./${project._id}`

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      console.log(`Directory created: ${dir}`);
   }

    manifest.id = "https://static.t-pen.org/" + project._id + "/manifest.json"
    manifest.type = "Manifest"
    manifest.label = { en: [project.label] }
    manifest.metadata = project.metadata
    manifest.items = await Promise.all(
      project.layers.map(async (layer) => {
          try {
              const canvasUrl = layer.pages[0].canvas
              const canvasName = path.parse(canvasUrl.substring(canvasUrl.lastIndexOf("/") + 1)).name
              let response = await fetch(canvasUrl)
              if (!response.ok) throw new Error(`Failed to fetch ${canvasUrl}`)
              response = await response.json()            
              manifest["@context"] = response["@context"]
              let response_items = {
                id: response.id,
                type: response.type,
                label: response.label,
                width: response.width,
                height: response.height,
                items: response.items
              }
              fs.writeFileSync(path.join(dir,`./${canvasName}.json`), JSON.stringify(response, null, 2))
              let annotations = response.annotations.map(async (annotation, index) => {
                const pageUrl = annotation.id
                const pageName = path.parse(pageUrl.substring(pageUrl.lastIndexOf("/") + 1)).name
                let response_annotations = await fetch(pageUrl)
                if (!response_annotations.ok) throw new Error(`Failed to fetch ${response.annotations}`)
                response_annotations = await response_annotations.json()
                let response_page = {
                  "@context": response_annotations["@context"],
                  id: response_annotations.id,
                  type: response_annotations.type,
                  label: response_annotations.label,
                  items: await Promise.all(response_annotations.items.map(async (item) => {
                    const lineUrl = item.id
                    const lineName = path.parse(lineUrl.substring(lineUrl.lastIndexOf("/") + 1)).name
                    let response_lines = await fetch(lineUrl)
                    if (!response_lines.ok) throw new Error(`Failed to fetch ${response_annotations.items}`)
                    response_lines = await response_lines.json()
                    fs.writeFileSync(path.join(dir,`./${lineName}.json`), JSON.stringify(response_lines, null, 2))
                    return { ...response_lines }
                  })),
                  partOf : index < Math.floor(response.annotations.length / 2) ? "https://static.t-pen.org/" + project._id + "/transcription-layer.json" : "https://static.t-pen.org/" + project._id + "/translation-layer.json",
                  creator: response_annotations.creator,
                  target: response_annotations.target
                  
                }
                fs.writeFileSync(path.join(dir,`./${pageName}.json`), JSON.stringify(response_page, null, 2))
                return { ...response_page }
              })
              const all_annotations = await Promise.all(annotations)
              response_items.annotations = all_annotations
              return response_items
          } catch (error) {
              console.error(`Error fetching ${canvasUrl}:`, error)
              return null
          }
      })
    )
    return manifest
  }

  static async loadAsUser(project_id, user_id) {
    const pipeline = [
      { $match: { _id: project_id } },
      {
        $lookup: {
          from: 'groups',
          localField: 'group',
          foreignField: '_id',
          as: 'groupData'
        }
      },
      {
        $set: {
          thisGroup: { $arrayElemAt: ['$groupData', 0] }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { memberIds: { $ifNull: [{ $objectToArray: '$thisGroup.members' }, []] } },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$memberIds.k'] } } }
          ],
          as: 'membersData'
        }
      },
      {
        $set: {
          roles: { $mergeObjects: [{ $ifNull: ['$thisGroup.customRoles', {}] }, Group.defaultRoles] },
        }
      },
      {
        $set: {
          collaborators: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: { $ifNull: ['$thisGroup.members', {}] } },
                as: 'collab',
                in: {
                  k: '$$collab.k',
                  v: {
                    $mergeObjects: ['$$collab.v', {
                      profile: {
                        $getField: {
                          field: '$$collab.k', input: {
                            $arrayToObject: {
                              $map: {
                                input: '$membersData',
                                as: 'm',
                                in: { k: '$$m._id', v: '$$m.profile' }
                              }
                            }
                          }
                        }
                      }
                    }]
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          label: 1,
          title: 1,
          creator: 1,
          collaborators: 1,
          roles: 1,
          layers: { $ifNull: ['$layers', []] },
          metadata: { $ifNull: ['$metadata', []] },
          manifest: 1,
          license: 1,
          tools: 1,
          options: 1,
        }
      }
    ]
    try {
      return (await database.controller.db.collection('projects').aggregate(pipeline).toArray())?.[0]
    } catch (err) {
      console.error(err)
      err.status = 500
      return err
    }
  }
}
