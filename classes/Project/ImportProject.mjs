import {Page} from "../Page/Page.mjs"
import Project from "./Project.mjs"

let err_out = Object.assign(new Error(), {
  status: 500,
  message: "Unknown Server error"
})

export default class ImportProject {
  constructor(data) {
    this.data = data
  }

  static async fetchManifest(url) {
    return fetch(url)
      .then((response) => {
        return response.json()
      })
      .catch((err) => {
        err_out.status = 404
        err_out.message = "Manifest not found. Please check URL"
        throw err_out
      })
  }

  static async processManifest(manifest) {
    if (!manifest) {
      err_out.status = 404
      err_out.message = "No manifest found. Cannot process empty object"
      throw err_out
    }
    let newProject = {}
    newProject.title = manifest.label
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
    return ImportProject.fetchManifest(manifestId)
      .then((manifest) => {
        return ImportProject.processManifest(manifest)
      })
      .then(async (project) => {
        const projectObj = new Project()
        return await projectObj.create({...project, creator})
      })
      .catch((err) => {
        err_out.status = err.status??500
        err_out.message = err.message?? "Internal Server Error"
        throw err_out
      })
  }
}
