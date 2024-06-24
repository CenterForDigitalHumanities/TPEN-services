import {Page} from "../Page/Page.mjs"
import Project from "./Project.mjs"

export default class ImportProject {
  constructor(data) {
    this.data = data
  }

  static async fetchManifest(manifestId) {
    const url = `https://t-pen.org/TPEN/project/${manifestId}`
    return fetch(url)
      .then((response) => {
        return response.json()
      })
      .catch((err) => {
        return err
      })
  }

  static async processManifest(manifest) {
    let newProject = {}
    newProject.title = manifest.label
    newProject.label = manifest.label
    newProject.metadata = manifest.metadata
  
    newProject["@context"] = "http://t-pen.org/3/context.json"
    newProject.manifest = manifest["@id"] ?? manifest.id
    let canvas = manifest.items ?? manifest?.sequences[0]?.canvases
    newProject.layers = await ImportProject.processLayerFromCanvas(canvas)

    return newProject
  }

  static async processLayerFromCanvas(canvases) {
    if (!canvases.length) return []

    let layers = []

    try {
      canvases.map(async (canvas) => {
        let layer = {}
        layer["@id"] = canvas["@id"]
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

  static async fromManifest(manifestId) {
    return ImportProject.fetchManifest(manifestId)
      .then((manifest) => {
        return ImportProject.processManifest(manifest)
      })
      .then(async (project) => {
        const projectObj = new Project()
        const savedProject = await projectObj.create(project)
        return {
          status: 201,
          message: "Project imported successfully",
          data: savedProject
        }
      })
      .catch((err) => {
        console.error("Failed to import project:", err)
        throw err
      })
  }
}
