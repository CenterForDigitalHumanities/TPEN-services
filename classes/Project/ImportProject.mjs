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
    
newProject["@context"]= manifest["@context"]
newProject["@context"]= manifest["@context"] 
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
          layer.pages = canvas?.otherContent??[]
          layer?.pages?.map((page)=>{
            page.canvas = page.on
            page.lines = page.resources??[]
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
        return savedProject
      })
      .catch((err) => {
        console.error("Failed to import project:", err)
        throw err
      })
  }
}

let one = {
  _id: {
    $oid: "65f48b254da4e4b8c656d0d1"
  },
  slug: "exampleProject",
  creator: "https://store.rerum.io/v1/id/exampleAgent",
  created: 1,
  group: {
    $oid: "65f48c9a4da4e4b8c656d0d2"
  },
  layers: ["https://store.rerum.io/v1/id/exampleAnnotationCollection"],
  lastModified: "exampleAnnotationPageId",
  viewer: "https://static.t-pen.org/#65f48b254da4e4b8c656d0d1",
  license: "CC-BY",
  manifest: "https://external.example.com/manifest.json",
  tools: [],
  options: {},
  tags: ["gog"],
  title: "First Project"
}

let two = {
  "@context": "http://t-pen.org/3/context.json",
  "@type": "CreativeWork",
  _id: "6674489bce18bbee644a606c",
  "@type": "CreativeWork",
  name: "A good name",
  layers: ["#LayerId1"],
  manifest: "https://iiif.io/api/cookbook/recipe/0001-mvm-image/manifest.json",
  creator: "https://store.rerum.io/v1/id/hash",
  group: "#GroupId",
  tools: [],
  options: {}
}

let three = {
  "@context": "http://t-pen.org/3/context.json",
  _id: "6674489bce18bbee644a606c",
  "@type": "CreativeWork",
  title: "Single Image Example",
  label: "Single Image Example",
  layers: [
    {
      id: "1718896796767",
      "@type": "Layer",
      pages: [
        {
          id: "1718896795531",
          "@type": "Page",
          lines: [
            {
              id: "22345545545531",
              "@type": "Line",
              text: "Hello World",
              selector:
                "https://iiif.io/api/cookbook/recipe/0001-mvm-image/canvas/p1#xywh=10,20,30,40"
            }
          ],
          canvas: "https://iiif.io/api/cookbook/recipe/0001-mvm-image/canvas/p1"
        }
      ]
    }
  ],
  manifest: "https://iiif.io/api/cookbook/recipe/0001-mvm-image/manifest.json"
}
