// import {Manifest} from "manifesto.js"
import {Page} from "../classes/Page/Page.mjs"
import Project from "../classes/Project/Project.mjs"
import dbDriver from "../database/driver.mjs"

const database = new dbDriver("mongo")
// THIS MODULE WILL BE DELETED. CONTENT MOVED TO /Classes/Project/
export class ImportProject {
  constructor(data) {
    this.data = data
  }

  static async fetchManifest(manifestId) {
    console.log("fetch manifest 1")
    const url = `https://t-pen.org/TPEN/project/${manifestId}`
    return fetch(url).then((response) => {
      let j = response.json()
      console.log(j)
      return j
    }).catch(err => {
      console.error("Could not fetch manifest 1")
      console.error(err)
      return err
    })
  }

  static async processPageFromCanvas(canvases) {
    let pages = []

    try {
      canvases.map(async (canvas) => {
        let pageObj = new Page()
        let newPage = await pageObj.create(canvas)
        pages.push(newPage)
      })

      return pages
    } catch (error) {
      console.log(error)
    }
  }

  static async processManifest(manifestId) {
    return ImportProject.fetchManifest(manifestId)
      .then((manifest) => {
        let newProject = {}
        newProject.title = manifest.title
        newProject.label = manifest.label
        newProject.metadata = manifest.metadata

        let canvas
        if (manifest.items) {
          canvas = manifest?.items
        } else {
          canvas = manifest?.sequences?.canvases
        }

        newProject.pages = ImportProject.processPageFromCanvas(canvas)

        return newProject
      })
      .catch((err) => {
        console.log(err)
      })
  }

  static async importProject(manifestId) {
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

// ToDo before PR
// remove test link from app.js
// clean up route in ./index.mjs
