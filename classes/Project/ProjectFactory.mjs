import Project from "./Project.mjs"
import Group from "../Group/Group.mjs" 
import User from "../User/User.mjs"
import dbDriver from "../../database/driver.mjs"
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
    newProject.label = manifest.label
    newProject.metadata = manifest.metadata 
    newProject["@context"] = "http://t-pen.org/3/context.json"
    newProject.manifest = manifest["@id"] ?? manifest.id
    let canvas = manifest.items ?? manifest?.sequences[0]?.canvases
    newProject.layers = await ProjectFactory.processLayerFromCanvas(canvas)

    return newProject
  }

  static async processLayerFromCanvas(canvases) {
    if (!canvases.length) return []

    let layers = []

    try {
      canvases.map(async (canvas) => {
        let layer = {}
        layer["@id"] = Date.now()
        layer["@type"] = "Layer"
        layer.pages = canvas?.otherContent ?? []
        layer?.pages?.map((page) => {
          page.canvas = page.on
          page.lines = page.resources ?? []
          delete page.resources
          delete page.on
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
      .then((manifest) => {
        return ProjectFactory.DBObjectFromManifest(manifest)
      })
      .then(async (project) => {
        const projectObj = new Project()
        const group = await Group.createNewGroup(creator, { label: project.label ?? project.title ?? `Project ${new Date().toLocaleDateString()}` }).then((group) => group._id)
        return await projectObj.create({...project, creator, group})
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
  
  static async loadAsUser(project_id,user_id) {
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
      { $unwind: '$groupData' },
      {
        $addFields: {
          userRoles: {
            $ifNull: [`$groupData.members.${user_id}.roles`, []]
          }
        }
      },
      {
        $match: {
          $or: [
            { 'userRoles': { $in: ['*_*_*', 'READ_*_*', 'READ_*_PROJECT'] } },
            { 'creator': user_id }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'groupData.members._id',
          foreignField: '_id',
          as: 'membersData'
        }
      },
      {
        $project: {
          _id: 1,
          label: 1,
          metadata: { $ifNull: ['$metadata', []] },
          layers: { $ifNull: ['$layers', []] },
          manifest: 1,
          creator: 1,
          license: 1,
          tools: 1,
          options: 1,
          roles: { $mergeObjects: [Group.defaultRoles, '$customRoles'] },
          collaborators: {
            $arrayToObject: {
              $map: {
                input: { $objectToArray: '$groupData.members' },
                as: 'member',
                in: {
                  k: '$$member.k',
                  v: {
                    roles: '$$member.v.roles',
                    profile: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$membersData',
                            as: 'user',
                            cond: { $eq: ['$$user._id', { $toObjectId: '$$member.k' }] }
                          }
                        },
                        0
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
    const project = await database.controller.db.collection('projects').aggregate(pipeline).toArray()
    return project[0]
  }
}
