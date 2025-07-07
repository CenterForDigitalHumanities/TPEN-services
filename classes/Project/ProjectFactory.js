import Project from "./Project.js"
import Group from "../Group/Group.js"
import User from "../User/User.js"
import Layer from "../Layer/Layer.js"
import Line from "../Line/Line.js"
import Page from "../Page/Page.js"
import dbDriver from "../../database/driver.js"
import vault from "../../utilities/vault.js"
import imageSize from 'image-size'
import mime from 'mime-types'
import Hotkeys from "../HotKeys/Hotkeys.js"

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

    const firstPage = layer.pages[0]?.id.split('/').pop() ?? true

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
   * Creates a new manifest from given image url and project label.
   * @param {string} imageUrl - URL of the image to be used in the project.
   * @param {string} label - Label for the project.
   * @returns {Object} - Returns the created project object.
   */

  static async getImageDimensions(imgUrl) {
    try {
      const response = await fetch(imgUrl)
      if (!response.ok) {
        throw {
          status: response.status,
          message: `Failed to fetch image: ${response.statusText}`
        }
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const dimensions = imageSize(buffer)
      return {
        width: dimensions.width,
        height: dimensions.height
      }
    } catch (err) {
      console.error("Error fetching image dimensions:", err.message)
      return
    }
  }

  static copiedProjectConfig(project, database, creator, modules = { 'Metadata': true, 'Tools': true }) {
    return {
      ...project,
      _id: database.reserveId(),
      label: `Copy of ${project.label}`,
      metadata: modules['Metadata'] ? project.metadata : [],
      manifest: project.manifest,
      layers: [],
      tools: modules['Tools'] ? project.tools : this.tools,
      _createdAt: Date.now().toString().slice(-6),
      _modifiedAt: -1,
      creator: creator
    }
  }

  static async cloneHotkeys(projectId, copiedProjectId) {
    const hotkeys = await Hotkeys.getByProjectId(projectId)
    if (hotkeys) {
      const copiedHotkeys = new Hotkeys(copiedProjectId, hotkeys.symbols)
      await copiedHotkeys.create()
    }
  }

  static async cloneGroup(project, creator, modules = { 'Group Members': true }) {
    const members = Object.fromEntries(
      Object.entries(project.collaborators).filter(([userId]) => {
        if (modules['Group Members'] && Array.isArray(modules['Group Members'])) {
          return modules['Group Members'].includes(userId)
        }
        return true
      }).map(([userId, user]) => {
        if (userId === creator) {
          return [userId, { roles: ['OWNER', 'LEADER'] }]
        }
        if (user.roles.includes('OWNER') || user.roles.includes('LEADER')) {
          return [userId, { roles: ['LEADER'] }]
        }
        return [userId, { roles: user.roles }]
      })
    )

    const customRoles = Object.fromEntries(
      Object.entries(project.roles).filter(([role]) => !['OWNER', 'LEADER', 'VIEWER', 'CONTRIBUTOR'].includes(role))
    )

    const copiedGroup = await Group.createNewGroup(
      creator,
      {
        label: `Copy of ${project.label}`,
        members: modules['Group Members'] ? members : { [creator]: { roles: [] } },
        customRoles: modules['Group Members'] ? customRoles : {}
      }
    )
    return copiedGroup
  }

  static async cloneLayers(project, copiedProject, database, withAnnotations = true) {
    for (const layer of project.layers) {
      const newLayer = {
        id: `${process.env.SERVERURL}project/${copiedProject._id}/layer/${database.reserveId()}`,
        label: layer.label,
        pages: []
      }

      const newPages = await this.clonePages(layer, copiedProject, database, withAnnotations)
      newLayer.pages.push(...newPages)
      copiedProject.layers.push(newLayer)
    }
  }

  static async clonePages(layer, copiedProject, database, withAnnotations) {
    const newPages = await Promise.all(layer.pages.map(async (page) => {
      if (withAnnotations) {
        return await this.clonePagesWithAnnotations(layer, page, copiedProject, database)
      }
      return await this.clonePageWithoutAnnotations(page, copiedProject, database)
    }))
    return newPages
  }

  static async clonePageWithoutAnnotations(page, copiedProject, database) {
    return {
      id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
      label: page.label,
      target: page.target
    }
  }

  static async clonePagesWithAnnotations(layer, page, copiedProject, database) {
    if(!page.id.startsWith(process.env.RERUMIDPREFIX)) {
      return {
        id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
        label: page.label,
        target: page.target
      }
    }
    else {
      return await fetch(page.id)
      .then(response => response.json())
      .then(async pageData => {
        const newPage = new Page(layer.id, {
          id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
          label: page.label,
          target: page.target,
          items: await Promise.all(pageData.items.map(async item => {
            return await fetch(item.id)
            .then(response => response.json())
            .then(async itemData => {
              const newItem = new Line({
                id: `${process.env.SERVERURL}project/${copiedProject._id}/line/${database.reserveId()}`,
                target: itemData.target,
                body: itemData.body,
                motivation: itemData.motivation,
                label: itemData.label,
                type: itemData.type
              })
              return await newItem.update()
            })
          }))
        })
        return await newPage.update()
      })
    }
  }

  static async copyProject(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    const project = await ProjectFactory.loadAsUser(projectId, creator)
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, creator)
    await this.cloneLayers(project, copiedProject, database, true)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project, creator, { 'Group Members': true })
    await this.cloneHotkeys(project._id, copiedProject._id)
    return await new Project().create({ ...copiedProject, creator, group: copiedGroup._id })
  }

  static async cloneWithoutAnnotations(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    const project = await ProjectFactory.loadAsUser(projectId, creator)
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, creator)
    await this.cloneLayers(project, copiedProject, database, false)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project, creator, { 'Group Members': true })
    await this.cloneHotkeys(project._id, copiedProject._id)
    return await new Project().create({ ...copiedProject, creator, group: copiedGroup._id })
  }

  static async cloneWithGroup(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }
    const project = await ProjectFactory.loadAsUser(projectId, creator)
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, creator, { 'Metadata': false, 'Tools': false })
    await this.cloneLayers(project, copiedProject, database, true)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project, creator, { 'Group Members': true })
    return await new Project().create({ ...copiedProject, creator, group: copiedGroup._id })
  }

  static async cloneWithCustomizations(projectId, creator, modules) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    if (!modules || typeof modules !== 'object') {
      throw {
        status: 400,
        message: "Modules must be an object"
      }
    }

    const project = await ProjectFactory.loadAsUser(projectId, creator)
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, creator, { 'Metadata': modules['Metadata'], 'Tools': modules['Tools'] })
    let result = {}

    if (modules['Layers'] && Array.isArray(modules['Layers']) && modules['Layers'].length > 0) {
      for (const layer of project.layers) {
        for (const newlayer of modules['Layers']) {
          if (newlayer.hasOwnProperty(layer.id)) {
            result[layer.id] = newlayer[layer.id].withAnnotations
            break
          }
          else {
            result[layer.id] = undefined
          }
        }

        if (result[layer.id] === undefined) {
          continue
        }

        const newLayer = {
          id: `${process.env.SERVERURL}project/${copiedProject._id}/layer/${database.reserveId()}`,
          label: layer.label,
          pages: []
        }

        let newPages = []

        if(result[layer.id]) {
          newPages = await this.clonePages(layer, copiedProject, database, true)
          newLayer.pages.push(...newPages)
          copiedProject.layers.push(newLayer)
        }

        if(!result[layer.id]) {
          newPages = await this.clonePages(layer, copiedProject, database, false)
          newLayer.pages.push(...newPages)
          copiedProject.layers.push(newLayer)
        }  
      }
    }
    else {
      const newLayer = {
        id: `${process.env.SERVERURL}project/${copiedProject._id}/layer/${database.reserveId()}`,
        label: project.layers[0].label,
        pages: []
      }
      const newPages = await this.clonePages(project.layers[0], copiedProject, database, false)
      newLayer.pages.push(...newPages)
      copiedProject.layers.push(newLayer)
    }

    modules['Group Members'].push(creator)
    const copiedGroup = await this.cloneGroup(project, creator, { 'Group Members': modules['Group Members'] })
    if( modules['Hotkeys'] ) {
      await this.cloneHotkeys(project._id, copiedProject._id)
    }
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    return await new Project().create({ ...copiedProject, creator, group: copiedGroup._id })
  }
  
  static async DBObjectFromImage(manifest) {
    if (!manifest) {
      throw {
        status: 404,
        message: err.message ?? "No manifest found. Cannot process empty object"
      }
    }
    const _id = manifest.id.split('/').slice(-2, -1)[0]
    const now = Date.now().toString().slice(-6)
    const label = ProjectFactory.getLabelAsString(manifest.label)
    const metadata = manifest.metadata ?? []
    const layer = Layer.build( _id, `First Layer - ${label}`, manifest.items ) 

    const firstPage = layer.pages[0]?.id.split('/').pop() ?? true

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

  static async createManifestFromImage(imageURL, projectLabel, creator) {
    if (!imageURL) {
      throw {
        status: 404,
        message: "No image found. Cannot process further."
      }
    }

    let isIIFImage = false
    let IIIFServiceParts = imageURL.split('/').reverse()
    let IIIFServiceJson = null

    function isValidIIIFRegion(region) {
      return (
        region === "full" ||
        region === "square" ||
        /^pct:\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?,\d+(\.\d+)?$/.test(region) || 
        /^\d+,\d+,\d+,\d+$/.test(region)
      )
    }

    function isValidIIIFSize(size) {
      return (
        size === "full" ||
        size.startsWith("^full") ||
        /^\d+,$/.test(size) ||
        size.startsWith("^") && /^\d+,$/.test(size) ||
        /^,\d+$/.test(size) ||
        size.startsWith("^") && /^,\d+$/.test(size) ||
        size.startsWith("pct:") && /^\d+(\.\d+)?$/.test(size) ||
        size.startsWith("^pct:") && /^\d+(\.\d+)?$/.test(size) ||
        /^\d+,\d+$/.test(size) ||
        size.startsWith("^") && /^\d+,\d+$/.test(size) ||
        size.startsWith("!") && /^\d+,\d+$/.test(size) ||
        size.startsWith("^!") && /^\d+,\d+$/.test(size)
      )
    }

    function isValidIIIFRotation(rotation) {
      return (
        /^\d+(\.\d+)?$/.test(rotation) ||
        size.startsWith("!") && /^\d+(\.\d+)?$/.test(rotation)
      )
    }

    function isValidIIIFQuality(quality) {
      return (
        quality === "default" ||
        quality === "color" ||
        quality === "gray" ||
        quality === "bitonal"
      )
    }

    let IIIFServiceURL = IIIFServiceParts.slice(4).reverse().join("/")

    if (isValidIIIFQuality(IIIFServiceParts[0].split(".")[0]) && isValidIIIFRotation(IIIFServiceParts[1]) && isValidIIIFSize(IIIFServiceParts[2]) && isValidIIIFRegion(IIIFServiceParts[3])) {
      await fetch(`${IIIFServiceURL}/info.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch IIIF info: ${response.statusText}`)
          }
          return response.json()
        })
        .then(info => {
          if (info?.protocol === "http://iiif.io/api/image") {
            isIIFImage = true
            IIIFServiceJson = info
          }
        })
        .catch(err => {
          console.error("Error fetching IIIF info:", err.message)
          throw {
            status: 500,
            message: "Failed to fetch IIIF info"
          }
        })
    }

    const _id = database.reserveId()
    const now = Date.now().toString().slice(-6)
    const label = projectLabel ?? now
    const dimensions = await this.getImageDimensions(imageURL)

    const canvasLayout = {
      id: `${process.env.TPENSTATIC}/${_id}/canvas-1.json`,
      type: "Canvas",
      label: { "none": [`${label} Page 1`] },
      width: dimensions.width,
      height: dimensions.height,
      items: [
        {
          id: `${process.env.TPENSTATIC}/${_id}/contentPage.json`,
          type: "AnnotationPage",
          items: [
            {
              id: `${process.env.TPENSTATIC}/${_id}/content.json`,
              type: "Annotation",
              motivation: "painting",
              body: {
                id: imageURL,
                type: "Image",
                format: mime.lookup(imageURL) || "image/jpeg",
                width: dimensions.width,
                height: dimensions.height,
                ...(isIIFImage && {
                  service: [{
                    id: IIIFServiceURL,
                    type: IIIFServiceJson?.type,
                    profile: IIIFServiceJson?.profile,
                  }]
                })
              },
              target: `${process.env.TPENSTATIC}/${_id}/canvas-1.json`
            }
          ]
        }
      ]
    }

    const projectManifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: `${process.env.TPENSTATIC}/${_id}/manifest.json`,
      type: "Manifest",
      label: { "none": [label] },
      items: [ canvasLayout ]
    }

    const projectCanvas = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      ...canvasLayout
    }

    await this.uploadFileToGitHub(projectManifest, _id)
    await this.uploadFileToGitHub(projectCanvas, _id)

    return await ProjectFactory.DBObjectFromImage(projectManifest)
    .then(async (project) => {
      const projectObj = new Project()
      const group = await Group.createNewGroup(creator,
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
    const fileName = manifest?.id?.split('/').pop() ?? 'manifest.json'
    const manifestUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${projectId}/${fileName}`
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

      const putResponse = await fetch(manifestUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: sha ? `Updated ${projectId}/${fileName}` : `Created ${projectId}/${fileName}`,
            content: Buffer.from(JSON.stringify(manifest)).toString('base64'),
            branch: process.env.BRANCH,
            ...(sha && { sha }),
        })
    })

    if (!putResponse.ok) {
      const errText = await putResponse.text()
      throw new Error(`GitHub upload failed: ${putResponse.status} - ${errText}`)
    }

    return await putResponse.json()

    } catch (error) {
      console.error(`Failed to upload ${projectId}/${fileName}:`, error)
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
