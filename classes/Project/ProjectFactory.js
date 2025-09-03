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
import { fetchUserAgent } from "../../utilities/shared.js"
import { checkIfUrlExists } from "../../utilities/checkIfUrlExists.js"

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

  static async DBObjectFromManifest(manifest, creator, importTPEN28 = false) {
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
    const layer = Layer.build( _id, `First Layer - ${label}`, manifest.items, creator )

    const firstPage = layer.pages[0]?.id.split('/').pop() ?? true

    // required properties: id, label, metadata, manifest, layers
    return {
      _id,
      label,
      metadata,
      manifest: importTPEN28 ? [ manifest.id.split('/manifest.json')[0] + '?version=3' ] : [ manifest.id ],
      layers: [ layer.asProjectLayer() ],
      tools: this.tools,
      _createdAt: now,
      _modifiedAt: -1,
      _lastModified: firstPage,
    }
  }

  static getLabelAsString(label) {
    if (label === null || label === undefined) return "" 
    if (typeof label === "string") return label
    if (typeof label !== "object") return ""
    const lang = Object.keys(label).length ? Object.keys(label)[0] : null
    if (!lang) return ""
    if (!label[lang] || !Array.isArray(label[lang])) return ""
    return label[lang].join(", ")
  }

  static async fromManifestURL(manifestId, creator, importTPEN28 = false) {
    return vault.loadManifest(manifestId)
      .then(async (manifest) => {
        return await ProjectFactory.DBObjectFromManifest(manifest, creator, importTPEN28)
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

  static copiedProjectConfig(project, database, modules = { 'Metadata': true, 'Tools': true }) {
    return {
      ...project,
      _id: database.reserveId(),
      label: `Copy of ${project.label}`,
      metadata: modules['Metadata'] ? project.metadata : [],
      manifest: project.manifest,
      layers: [],
      tools: modules['Tools'] ? project.tools : this.tools,
      _createdAt: Date.now().toString().slice(-6),
      _modifiedAt: -1
    }
  }

  static async cloneHotkeys(projectId, copiedProjectId) {
    const hotkeys = await Hotkeys.getByProjectId(projectId)
    if (hotkeys) {
      const copiedHotkeys = new Hotkeys(copiedProjectId, hotkeys.symbols)
      await copiedHotkeys.create()
    }
  }

  static async cloneGroup(projectId, creator, modules = { 'Group Members': true }) {
    const project = await ProjectFactory.loadAsUser(projectId, creator)
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

  static async cloneLayers(project, copiedProject, creator, database, withAnnotations = true) {
    for (const layer of project.layers) {
      let newLayer = {
        id: layer.pages.map(page => Array.isArray(page.items) && page.items.length > 0).some(Boolean) ? `${process.env.RERUMIDPREFIX}${database.reserveId()}` : `${process.env.SERVERURL}project/${copiedProject._id}/layer/${database.reserveId()}`,
        label: layer.label,
        pages: []
      }

      const newPages = await this.clonePages(layer, copiedProject, creator, database, withAnnotations)
      for (const page of newPages) {
        const updatedPage = new Page(
          newLayer.id,
          { id: page.id, label: page.label, target: page.target,
            items: page.items,
            creator: creator,
            partOf: newLayer.id,
            prev: newPages[newPages.indexOf(page) - 1]?.id,
            next: newPages[newPages.indexOf(page) + 1]?.id
          })
        await updatedPage.update()
      }
      newLayer.pages.push(...newPages)
      if (newLayer.id.startsWith(process.env.RERUMIDPREFIX)) {
        await new Layer(copiedProject._id, {
          id: newLayer.id.split('/').pop(),
          label: newLayer.label,
          pages: newLayer.pages,
          creator: creator
        }).update(true)
      }
      copiedProject.layers.push(newLayer)
    }
  }

  static async clonePages(layer, copiedProject, creator, database, withAnnotations) {
    const newPages = await Promise.all(layer.pages.map(async (page) => {
      if (withAnnotations) {
        return await this.clonePagesWithAnnotations(layer, page, copiedProject, creator, database)
      }
      return await this.clonePageWithoutAnnotations(page, copiedProject, database)
    }))
    return newPages
  }

  static async clonePageWithoutAnnotations(page, copiedProject, database) {
    return {
      id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
      label: page.label,
      target: page.target,
      items: []
    }
  }

  static async clonePagesWithAnnotations(layer, page, copiedProject, creator, database) {
    if(!page.id.startsWith(process.env.RERUMIDPREFIX)) {
      return {
        id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
        label: page.label,
        target: page.target,
        items: []
      }
    }
    else {
      return await fetch(page.id)
      .then(response => response.json())
      .then(async pageData => {
        const newPage = new Page(layer.id,{
          id: `${process.env.SERVERURL}project/${copiedProject._id}/page/${database.reserveId()}`,
          label: page.label,
          target: page.target,
          creator: creator,
          items: await Promise.all(pageData.items.map(async item => {
            return await fetch(item.id)
            .then(response => response.json())
            .then(async itemData => {
              const newItem = new Line({
                id: `${process.env.SERVERURL}project/${copiedProject._id}/line/${database.reserveId()}`,
                type: itemData.type,
                label: itemData.label,
                motivation: itemData.motivation,
                body: itemData.body,
                target: itemData.target,
                creator: creator
              })
              return await newItem.update()
            })
          }))
        })
        return await newPage.update()
      })
    }
  }

  // We might add the Vault here to get the Manifest version 3
  static transformManifestUrl(url, protocol) {
      const parsedUrl = new URL(url)
      parsedUrl.protocol = protocol
      if (parsedUrl.pathname.endsWith("/manifest.json")) {
          parsedUrl.pathname = parsedUrl.pathname.replace(/\/manifest\.json$/, "")
      }
      parsedUrl.search = "?version=3"
      return parsedUrl.toString()
  }

  static async importTPEN28(projectTPEN28Data, projectTPEN3Data, userToken, protocol) {
    if (!projectTPEN28Data || !projectTPEN3Data) {
      throw {
        status: 400,
        message: "Invalid project data"
      }
    }

    const symbols = projectTPEN28Data.projectButtons.map(button => String.fromCharCode(button.key))
    if (symbols && symbols.length > 0) {
      const copiedHotkeys = new Hotkeys(projectTPEN3Data._id, symbols)
      await copiedHotkeys.create()
    }
    let projectTools = []
    try {
      projectTools = [...projectTPEN28Data.userTool, ...projectTPEN28Data.projectTool]
    }
    catch (err) {
      // Just in case the spread operator didn't end up making an array due to 'undefined' or something weird.
      projectTools = []
    }
    const toolList = projectTPEN3Data.tools.map((tool) => tool.value)
    const selectedTools = toolList.map((tool) => ({
        value: tool,
        state: projectTools.includes(tool),
    }))
    const project = new Project(projectTPEN3Data._id)
    if (selectedTools && selectedTools.length > 0) {
      await project.updateTools(selectedTools)
    }
    const allCanvases = projectTPEN3Data.layers[0].pages.map((page) => page.target)
    const allPagesIds = projectTPEN3Data.layers[0].pages.map((page) =>page.id.replace(/project\/([a-f0-9]+)/, `project/${projectTPEN3Data._id}`))
    let manifestUrl = projectTPEN3Data.manifest[0]
    manifestUrl = this.transformManifestUrl(manifestUrl, protocol)
    const responseManifest = await fetch(manifestUrl)
    if (!responseManifest.ok) {
        throw new Error(`Failed to fetch: ${responseManifest.statusText}`)
    }
    
    const manifestJson = await responseManifest.json()
    const itemsByPage = {}
    manifestJson.items.map((item, index) => {
      const canvasId = item.id
      if (allCanvases.includes(canvasId)) {
        const annotations = item.annotations?.flatMap(
          (annotation) =>
            annotation.items?.flatMap((innerItems) => ({
            body: {
              type: innerItems.body?.type,
              format: innerItems.body?.format,
              value: innerItems.body?.value,
            },
            motivation: innerItems.motivation,
            target: innerItems.target,
            type: innerItems.type,
            })) || []
          ) || []
        itemsByPage[allPagesIds[index]] = annotations
      }
    })
    
    for (const [endpoint, annotations] of Object.entries(itemsByPage)) {
        try {
          const response = await fetch(`${endpoint}/line`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userToken}`,
            },
            body: JSON.stringify(annotations),
          })
          if (!response.ok) {
            throw new Error(`Failed to import annotations: ${response.statusText}`)
          }
      } catch (error) {
        console.error("Error importing annotations:", error)
      }
    }

    return projectTPEN3Data
  }

  static async copyProject(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    const project = await new Project(projectId).loadProject()
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database)
    await this.cloneLayers(project, copiedProject, creator, database, true)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project._id, creator, { 'Group Members': true })
    await this.cloneHotkeys(project._id, copiedProject._id)
    return database.save({ ...copiedProject, creator, group: copiedGroup._id }, "projects")
  }

  static async cloneWithoutAnnotations(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    const project = await new Project(projectId).loadProject()
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database)
    await this.cloneLayers(project, copiedProject, creator, database, false)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project._id, creator, { 'Group Members': true })
    await this.cloneHotkeys(project._id, copiedProject._id)
    return database.save({ ...copiedProject, creator, group: copiedGroup._id }, "projects")
  }

  static async cloneWithGroup(projectId, creator) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }
    const project = await new Project(projectId).loadProject()
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, { 'Metadata': false, 'Tools': false })
    await this.cloneLayers(project, copiedProject, creator, database, true)
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    const copiedGroup = await this.cloneGroup(project._id, creator, { 'Group Members': true })
    return database.save({ ...copiedProject, creator, group: copiedGroup._id }, "projects")    
  }

  static async cloneWithCustomizations(projectId, creator, modules) {
    if (!projectId) {
      throw {
        status: 400,
        message: "No project ID provided"
      }
    }

    // modules is an object with keys as module names and values as true/false
    // e.g. { 'Metadata': true, 'Group Members': [member1, member2], 'Hotkeys': true, 'Tools': false, 'Layers': [{ 'layerId1': { withAnnotations: true } }, { 'layerId2': { withAnnotations: false } }] }

    if (!modules || typeof modules !== 'object') {
      throw {
        status: 400,
        message: "Modules must be an object"
      }
    }

    const project = await new Project(projectId).loadProject()
    if (!project) {
      throw {
        status: 404,
        message: "Project not found"
      }
    }

    let copiedProject = this.copiedProjectConfig(project, database, { 'Metadata': modules['Metadata'], 'Tools': modules['Tools'] })
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
          id: result[layer.id] && layer.pages.map(page => Array.isArray(page.items) && page.items.length > 0).some(Boolean) ? `${process.env.RERUMIDPREFIX}${database.reserveId()}` : `${process.env.SERVERURL}project/${copiedProject._id}/layer/${database.reserveId()}`,
          label: layer.label,
          pages: []
        }

        let newPages = []

        if(result[layer.id]) {
          newPages = await this.clonePages(layer, copiedProject, creator, database, true)
          for (const page of newPages) {
            const updatedPage = new Page(
              newLayer.id,
              { id: page.id, label: page.label, target: page.target,
                items: page.items,
                creator: creator,
                partOf: newLayer.id,
                prev: newPages[newPages.indexOf(page) - 1]?.id ?? null,
                next: newPages[newPages.indexOf(page) + 1]?.id ?? null
              })
            await updatedPage.update()
          }
          newLayer.pages.push(...newPages)
          if (newLayer.id.startsWith(process.env.RERUMIDPREFIX)) {
            await new Layer(copiedProject._id, {
              id: newLayer.id.split('/').pop(),
              label: newLayer.label,
              pages: newLayer.pages,
              creator: creator
            }).update(true)
          }
          copiedProject.layers.push(newLayer)
        }

        if(!result[layer.id]) {
          newPages = await this.clonePages(layer, copiedProject, creator, database, false)
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
      const newPages = await this.clonePages(project.layers[0], copiedProject, creator, database, false)
      newLayer.pages.push(...newPages)
      copiedProject.layers.push(newLayer)
    }

    modules['Group Members'].push(creator)
    const copiedGroup = await this.cloneGroup(project._id, creator, { 'Group Members': modules['Group Members'] })
    if( modules['Hotkeys'] ) {
      await this.cloneHotkeys(project._id, copiedProject._id)
    }
    copiedProject._lastModified = copiedProject.layers[0]?.pages[0]?.id.split('/').pop()
    return database.save({ ...copiedProject, creator, group: copiedGroup._id }, "projects")
  }
  
  static async DBObjectFromImage(manifest, creator) {
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
    const layer = Layer.build( _id, `First Layer - ${label}`, manifest.items, creator) 

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
      ],
      creator: await fetchUserAgent(creator),
    }

    const projectManifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      id: `${process.env.TPENSTATIC}/${_id}/manifest.json`,
      type: "Manifest",
      label: { "none": [label] },
      items: [ canvasLayout ],
      creator: await fetchUserAgent(creator),
    }

    const projectCanvas = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      ...canvasLayout
    }

    await this.uploadFileToGitHub(projectManifest, _id)
    await this.uploadFileToGitHub(projectCanvas, _id)

    return await ProjectFactory.DBObjectFromImage(projectManifest, creator)
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
    const manifestJson = await this.fetchJson(project.manifest[0])

    const manifest = {
      "@context": "http://iiif.io/api/presentation/3/context.json",
      "id": `${process.env.TPENSTATIC}/${projectId}/manifest.json`,
      type: "Manifest",
      label: { none: [project.label] },
      metadata: project.metadata,
      items: await this.getManifestItems(project, manifestJson),
      creator: await fetchUserAgent(project.creator)
    }
    return manifest
  }

  static async getManifestItems(project, manifestJson) {
    return Promise.all(
      manifestJson.items.map(async (canvas) => {
        try {
          let canvasItems = {
            id: canvas.id,
            type: canvas.type,
            label: canvas.label,
            width: canvas.width,
            height: canvas.height,
            items: canvas.items,
            creator: await fetchUserAgent(project.creator),
          }

          const annotationPages = []
          await Promise.all(project.layers.map(layer => {
              return layer.pages.forEach(page => {
                if((page.target === canvas.id) && page.id.startsWith(process.env.RERUMIDPREFIX) ) {
                  const annotationPage = {
                    id: page.id,
                    type: "AnnotationPage"
                  }
                  annotationPages.push(annotationPage)
                }
              })
            })
          )
          annotationPages.length > 0 && (canvasItems.annotations = await this.getAnnotations({ annotations: annotationPages }))
          return canvasItems
        } catch (error) {
          console.error(`Error processing layer:`, error)
          return 
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
            ...(annotationData?.prev) && {
              prev: annotationData.prev
            },
            ...(annotationData?.next) && {
              next: annotationData.next
            },
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

  /**
   * Reads a the manifest.json from TPEN Static for Read-Only transcribe view.
   * 
   * @param {string} projectId - The ID of the project to read the manifest from.
   * @returns {Object} - The parsed JSON content of the manifest file.
   */
  static async readFileFromGitHub(projectId) {
    const manifestUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/contents/${projectId}/manifest.json`
    const token = process.env.GITHUB_TOKEN

    try {
      const response = await fetch(manifestUrl, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`GitHub read failed: ${response.status} - ${errText}`)
      }

      const output = {}
      const canvasMap = {}
      const fileData = await response.json()
      const contentBuffer = Buffer.from(fileData.content, 'base64')
      const manifest = JSON.parse(contentBuffer.toString('utf-8'))

      for (const canvas of manifest.items) {
        const imageUrl = canvas.items[0].items.find(i => i.motivation === "painting").body.id
        const canvasLabel = canvas.annotations[0].label.none[0]
        canvasMap[imageUrl] = canvasLabel
      }

      for (const canvas of manifest.items) {
        for (const annoPage of canvas.annotations) {
          const partOfId = await fetch(annoPage.partOf[0].id).then(res => res.json())
          const layerLabel = partOfId.label.none[0]

          if (!output[layerLabel]) {
            output[layerLabel] = {}
            for (const [imageUrl, canvasLabel] of Object.entries(canvasMap)) {
              output[layerLabel][imageUrl] = { label: canvasLabel, lines: [] }
            }
          }

          const lines = await Promise.all(
            annoPage.items.map(async (anno) => {
              const [x, y, w, h] = anno.target.selector.value.split(':')[1].split(',').map(Number)
              return { x, y, w, h, text: anno.body.value ?? '' }
            })
          )

          const imageUrl = canvas.items[0].items.find(i => i.motivation === "painting").body.id
          output[layerLabel][imageUrl].lines = lines
        }
      }

      for (const layerLabel of Object.keys(output)) {
        const canvases = Object.values(output[layerLabel])
        const maxLen = Math.max(...canvases.map(c => c.lines.length))

        const connectPages = []
        for (let i = 0; i < maxLen; i++) {
          for (const canvas of canvases) {
            if (canvas.lines[i]) {
              connectPages.push({ ...canvas.lines[i], fromCanvas: canvas.label })
            }
          }
        }

        for (const canvas of canvases) {
          canvas.lines = connectPages.filter(line => line.fromCanvas === canvas.label).map(({ fromCanvas, ...line }) => line)
        }
      }
      return output
    } catch (error) {
        console.error(`Failed to read manifest for project ${projectId}:`, error)
        throw error
    }
  }

  /**
    * Checks if the IIIF manifest has been exported and deployed to github for a specific project.
    * 
    * @param {string} projectId - The ID of the project to check.
    * @returns {Object} - Returns an object with status and message indicating the deployment status.
    * 
    * This method checks if the manifest.json file for a given project ID exists in the GitHub repository,
    * and if it has been successfully deployed. It retrieves the latest commit for the manifest file,
    * checks if it has been deployed, and returns the status of the deployment.
    * status: -1 A server or service error has occurred.
    * status: 1 is No manifest found
    * status: 2 is Manifest found, Recently Committed
    * status: 3 is Manifest found but no recent commit
    * status: 4 is Deployment successful
    * status: 5 is Deployment in progress
    * status: 6 is Deployment inactive
    * status: 7 is Deployment status failed
    * status: 8 is Unknown deployment status
    * status: 9 is No deployment found
    */

  static async checkManifestUploadAndDeployment(projectId) {
    const filePath = `${projectId}/manifest.json`
    const url = `${process.env.TPENSTATIC}/${projectId}/manifest.json`
    const token = process.env.GITHUB_TOKEN
    const headers = {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    }

    const commitsUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/commits?path=${filePath}&per_page=1`
    const commits = await fetch(commitsUrl, { headers })
      .then(async (resp) => {
          if(resp.ok) return resp.json()
          const errText = await resp.text()
          return [{state: -1, "message": `${resp.status} - ${errText}`}]
      })
      .catch(err => {
        console.error(err)
        return [{state: -1, "message": `TPEN Services Internal Server Error`}]
      })

    if(commits?.length && commits[0].state === -1) {
      console.error(commits[0])
      return {status: -1, message: commits[0].message}
    }

    if (!commits.length) {
        return {status: 1}
    }
    const commitMessage = commits[0].commit?.message.split(' ')

    if (commitMessage[0] === 'Delete') {
        return {status: 1}
    }

    const latestSha = commits[0].sha
    const deployments = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/deployments?sha=${latestSha}`
    const deployment = await fetch(deployments, { headers })
      .then(async (resp) => {
            if(resp.ok) return resp.json()
            const errText = await resp.text()
            return [{state: -1, "message": `${resp.status} - ${errText}`}]
      })
      .catch(err => {
        console.error(err)
        return [{state: -1, "message": `TPEN Services Internal Server Error`}]
      })

    if(deployment?.length && deployment[0].state === -1) {
      console.error(deployment[0])
      return {status: -1, message: deployment[0].message}
    }

    if (deployment.length === 0) {
      if (await checkIfUrlExists(url)){
        if(new Date(commits[0].commit?.committer?.date) > new Date(Date.now() - 2 * 60 * 1000)) {
          return {status: 2}
        }
        else {
          return {status: 3}
        }
      }
      return {status: 9}
    }

    const statusUrl = `https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/deployments/${deployment[0].id}/statuses`
    const statuses = await fetch(statusUrl, { headers })
      .then(async (resp) => {
          if(resp.ok) return resp.json()
          const errText = await resp.text()
          return [{state: -1, "message": `${resp.status} - ${errText}`}]
      })
      .catch(err => {
        console.error(err)
        return [{state: -1, "message": `TPEN Services Internal Server Error`}]
      })

    if (statuses?.length && statuses[0].state === -1) {
      console.error(statuses[0])
      return {status: -1, message: statuses[0].message}
    }

    if (!statuses.length) {
        return {status: 8}
    }

    const latestStatus = statuses[0]
    const state = latestStatus.state

    if (state === 'success') {
        return {status: 4}
    } else if (['queued', 'in_progress', 'pending'].includes(state)) {
        return {status: 5}
    } else if (state === 'inactive') {
        return {status: 6}
    } else if (state === 'error') {
        return {status: 7}
    } else {
        return {status: 8}
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
