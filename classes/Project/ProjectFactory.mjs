import Project from "./Project.mjs"
import Group from "../Group/Group.mjs"
import User from "../User/User.mjs"
import dbDriver from "../../database/driver.mjs"
import fs from "fs"
import path from "path"
import { Vault } from '@iiif/helpers/vault'

const vault = new Vault()
const database = new dbDriver("mongo")

export default class ProjectFactory {
  constructor(data) {
    this.data = data
  }

  static loadManifest = vault.loadManifest

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
    const now = Date.now().toString().slice(-6)
    const metadata = manifest.metadata ?? []
    const pages = await ProjectFactory.buildPagesFromCanvases(manifest.items)
    console.log("Pages: ", pages)
    return {
      label: ProjectFactory.getLabelAsString(manifest.label) ?? `Project ${now}`,
      metadata,
      manifest: [ manifest.id ],
      layers: [ {
          id: `${process.env.SERVERURL}layer/${database.reserveId()}`,
          label: `First Layer - ${ProjectFactory.getLabelAsString(manifest.label) ?? now}`,
          pages,
      } ]
    }
  }

  static getLabelAsString(label) {
    const defaultLanguage = typeof label === 'object' ? Object.keys(label)[0] : 'en'
    return label[defaultLanguage]?.join(", ") ?? label.none?.join(",")
  }

  static async buildPagesFromCanvases(canvases) {
    try {
      if (!canvases.length || !Array.isArray(canvases)) throw new Error("No canvases found in the manifest")

      const pages = canvases.map(async (c, index) => {
        const canvas = await vault.get(c)
        return {
          id: `${process.env.SERVERURL}page/${canvas.id?.split('/').pop()}`,
          label: ProjectFactory.getLabelAsString(canvas.label) ?? `Page ${index + 1}`,
          target: canvas.id
        }
      })
      return await Promise.all(pages)
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  static async fromManifestURL(manifestId, creator) {
    return vault.loadManifest(manifestId)
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

  /**
   * Exporting the IIIF manifest for a given project in its current state, ensuring the directory structure is created,
   * manifest data is assembled, and the final JSON is saved to the filesystem.
   * 
   * @param {string} projectId - Project ID for a specific project.
   * @returns {Object} - Returns the assembled IIIF manifest object.
   * 
   * The manifest follows the IIIF Presentation API 3.0 specification and includes:
   * - Context, ID, Type, Label, Metadata, Items and Annotations
   * - A dynamically fetched list of manifest items, including canvases and their annotations.
   * - All elements are embedded in the manifest object.
   * - Saved output to the file system as 'manifest.json' within the project directory.
   */
  static async exportManifest(projectId) {
    if (!projectId) {
      throw { status: 400, message: "No project ID provided" }
    }

    const project = await ProjectFactory.loadAsUser(projectId, null)
    const dir = `./${projectId}`
    this.createDirectory(dir)

    const manifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      "id": `${process.env.TPENSTATIC}/${projectId}/manifest.json`,
      type: "Manifest",
      label: { none: [project.label] },
      metadata: project.metadata,
      items: await this.getManifestItems(project, dir),
    }
    this.saveToFile(dir, 'manifest.json', manifest)
    return manifest
  }

  static createDirectory(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  static async getManifestItems(project, dir) {
    return Promise.all(
      project.layers.map(async (layer) => {
        try {
          const canvasUrl = layer.pages[0].canvas
          const canvasData = await this.fetchJson(canvasUrl)
          if (!canvasData) return null

          const canvasItems = {
            id: canvasData.id ?? canvasData["@id"],
            type: canvasData.type,
            label: canvasData.label,
            width: canvasData.width,
            height: canvasData.height,
            items: canvasData.items,
            annotations: await this.getAnnotations(canvasData, project._id, dir),
          }
          return canvasItems
        } catch (error) {
          console.error(`Error processing layer:`, error)
          return null
        }
      })
    )
  }

  static async getAnnotations(canvasData, projectId, dir) {
    return Promise.all(
      canvasData.annotations.map(async (annotation, index) => {
        try {
          const annotationData = await this.fetchJson(annotation.id)
          if (!annotationData) return null

          const annotationItems = {
            id: annotationData.id ?? annotationData["@id"],
            type: annotationData.type,
            label: annotationData.label,
            items: await this.getLines(annotationData, dir),
            partOf: annotationData.partOf,
            creator: annotationData.creator,
            target: annotationData.target,
          }
          return annotationItems
        } catch (error) {
          console.error(`Error processing annotation:`, error)
          return null
        }
      })
    )
  }

  static async getLines(annotationData, dir) {
    return Promise.all(
      annotationData.items.map(async (item) => {
        try {
          const lineData = await this.fetchJson(item.id)
          if (!lineData) return null

          const lineItems = {
            id: lineData.id ?? lineData["@id"],
            type: lineData.type,
            motivation: lineData.motivation,
            body: lineData.body,
            target: lineData.target,
            creator: lineData.creator
          }
          return lineItems
        } catch (error) {
          console.error(`Error processing line item:`, error)
          return null
        }
      })
    )
  }

  static async fetchJson(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to fetch ${url}`)
      return response.json()
    } catch (error) {
      console.error(`Fetch error: ${error.message}`)
      return null
    }
  }

  static getFileName(url) {
    const fileName = path.parse(url.substring(url.lastIndexOf("/") + 1)).name
    return fileName
  }

  static saveToFile(dir, url, data) {
    const fileName = this.getFileName(url)
    fs.writeFileSync(path.join(dir, `${fileName}.json`), JSON.stringify(data, null, 2))
  }

  /**
   * Uploads or updates the `manifest.json` file for a given project to a GitHub repository.
   * 
   * @param {string} filePath - The local path to the `manifest.json` file to be uploaded.
   * @param {string} projectId - Project ID for a specific project.
   * 
   * The method performs the following steps:
   * - Reads and encodes the file content in Base64.
   * - Checks if the `manifest.json` already exists in the GitHub repository to determine if it's a create or update action.
   * - Uploads the file using the GitHub API, including the correct commit message and SHA for updates.
   */
  static async uploadFileToGitHub(filePath, projectId) {
    const content = fs.readFileSync(filePath, { encoding: "base64" })
    const manifestUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${projectId}/manifest.json`
    const token = process.env.GITHUB_TOKEN

    try {
      let sha = null

      const getResponse = await fetch(manifestUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (getResponse.ok) {
        const fileData = await getResponse.json()
        sha = fileData.sha
      }

      await fetch(manifestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sha ? `Updated ${projectId}/manifest.json` : `Created ${projectId}/manifest.json`,
          content: content,
          branch: process.env.BRANCH,
          ...(sha && { sha }),
        }),
      })
    } catch (error) {
      console.error(`Failed to upload ${projectId}/manifest.json:`, error)
    }
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
        $lookup: {
          from: "hotkeys",
          localField: "_id",
          foreignField: "_id",
          as: "hotkeys"
        },
      },
      {
        $set: {
          "options.hotkeys": { $arrayElemAt: ["$hotkeys.symbols", 0] }
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
