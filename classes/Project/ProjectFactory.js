import Project from "./Project.js"
import Group from "../Group/Group.js"
import User from "../User/User.js"
import Layer from "../Layer/Layer.js"
import dbDriver from "../../database/driver.js"
import vault from "../../utilities/vault.js"

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

  static tools = [
    { 
      "name":"Page Tools",
      "value":"page",
      "state": false
    },
    {
      "name":"Inspect",
      "value":"inspector",
      "state": false
    },
    {
      "name":"Special Characters", 
      "value":"characters",
      "state": false
    },
    {
      "name":"XML Tags", 
      "value":"xml",
      "state": false
    },
    {
      "name":"View Full Page", 
      "value":"fullpage",
      "state": false
    },
    {
      "name":"History Tool", 
      "value":"history",
      "state": false
    },
    {
      "name":"Preview Tool", 
      "value":"preview",
      "state": false
    },
    {
      "name":"Parsing Adjustment", 
      "value":"parsing",
      "state": false
    },
    {
      "name":"Compare Pages", 
      "value":"compare",
      "state": false
    },
    {
      "name": "Cappelli's Abbreviation",
      "value": "cappelli",
      "url": "https://centerfordigitalhumanities.github.io/cappelli/",
      "state": false
    },
    {
      "name": "Enigma",
      "value": "enigma",
      "url": "https://ciham-digital.huma-num.fr/enigma/",
      "state": false
    },
    {
      "name": "Latin Dictionary",
      "value": "latin",
      "url": "https://www.perseus.tufts.edu/hopper/resolveform?lang=latin",
      "state": false
    },
    {
      "name": "Latin Vulgate",
      "value": "vulgate",
      "url": "https://vulsearch.sourceforge.net/cgi-bin/vulsearch",
      "state": false
    }
  ]

  static async DBObjectFromManifest(manifest) {
    if (!manifest) {
      throw {
        status: 404,
        message: err.message ?? "No manifest found. Cannot process empty object"
      }
    }
    const _id = database.reserveId()
    const now = Date.now().toString().slice(-6)
    const label = ProjectFactory.getLabelAsString(manifest.label) ?? now
    const metadata = manifest.metadata ?? []
    const layer = Layer.build( _id, `First Layer - ${label}`, manifest.items ) 

    const firstPage = layer.pages[0]?.id ?? true

    // required properties: id, label, metadata, manifest, layers
    return {
      _id,
      label,
      metadata,
      manifest: [ manifest.id ],
      layers: [ layer.asProjectLayer() ],
      tools: this.tools,
      _createdAt: now,
      _modifiedAt: -1,
      _lastModified: firstPage,
    }
  }

  static getLabelAsString(label) {
    const defaultLanguage = typeof label === 'object' ? Object.keys(label)[0] : 'en'
    return label[defaultLanguage]?.join(", ") ?? label.none?.join(",")
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
   * Exporting the IIIF manifest for a given project in its current state,
   * manifest data is assembled, and the final JSON is saved to the filesystem.
   * 
   * @param {string} projectId - Project ID for a specific project.
   * @returns {Object} - Returns the assembled IIIF manifest object.
   * 
   * The manifest follows the IIIF Presentation API 3.0 specification and includes:
   * - Context, ID, Type, Label, Metadata, Items and Annotations
   * - A dynamically fetched list of manifest items, including canvases and their annotations.
   * - All elements are embedded in the manifest object.
   */
  static async exportManifest(projectId) {
    if (!projectId) {
      throw { status: 400, message: "No project ID provided" }
    }

    const project = await ProjectFactory.loadAsUser(projectId, null)

    const manifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      "id": `${process.env.TPENSTATIC}/${projectId}/manifest.json`,
      type: "Manifest",
      label: { none: [project.label] },
      metadata: project.metadata,
      items: await this.getManifestItems(project),
    }
    return manifest
  }

  static async getManifestItems(project) {
    return Promise.all(
      project.layers.map(async (layer) => {
        try {
          const canvasUrl = layer.pages[0].target
          const canvasData = await this.fetchJson(canvasUrl)
          if (!canvasData) return null

          const canvasItems = {
            id: canvasData.id ?? canvasData["@id"],
            type: canvasData.type,
            label: canvasData.label,
            width: canvasData.width,
            height: canvasData.height,
            items: canvasData.items,
            annotations: await this.getAnnotations(canvasData),
          }
          return canvasItems
        } catch (error) {
          console.error(`Error processing layer:`, error)
          return null
        }
      })
    )
  }

  static async getAnnotations(canvasData) {
    return Promise.all(
      canvasData.annotations.map(async (annotation) => {
        try {
          const annotationData = await this.fetchJson(annotation.id)
          if (!annotationData) return null

          const annotationItems = {
            id: annotationData.id ?? annotationData["@id"],
            type: annotationData.type,
            label: annotationData.label,
            items: await this.getLines(annotationData),
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

  static async getLines(annotationData) {
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

  /**
   * Uploads or updates the `manifest.json` file for a given project to a GitHub repository.
   * 
   * @param {string} manifest - JSON Object representing the IIIF manifest.
   * @param {string} projectId - Project ID for a specific project.
   * 
   * The method performs the following steps:
   * - Creates a GitHub API URL for the `manifest.json` file in the GitHub repository.
   * - Checks if the `manifest.json` already exists in the GitHub repository to determine if it's a create or update action.
   * - Uploads the file using the GitHub API, including the correct commit message and SHA for updates.
   */
  static async uploadFileToGitHub(manifest, projectId) {
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
            content: Buffer.from(JSON.stringify(manifest)).toString('base64'),
            branch: process.env.BRANCH,
            ...(sha && { sha }),
        })
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
          _createdAt:1,
          _modifiedAt:1,
          _lastModified:1
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
