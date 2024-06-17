import dbDriver from "../../database/driver.mjs"
import { Page } from "../Page/Page.mjs"
import Project from "./Project.mjs"

const database = new dbDriver("mongo")

export default class ImportProject {
  constructor(data) {
    this.data = data
  }

  static async fetchManifest(manifestId) {
    // This url does not currently return the expected json object when called programmatically
    const url = `https://t-pen.org/TPEN/project/${manifestId}`
    return fetch(url).then((response) => {
     
      return response.json()
    })
  }

  static async processManifest(manifest) {
    let newProject = {}
    newProject.title = manifest.label
    newProject.label = manifest.label
    newProject.metadata = manifest.metadata
     let canvas;
    if (manifest.items) {
      canvas = manifest.items;
    } else {
      canvas = manifest?.sequences[0]?.canvases;
    }
     newProject.pages = await ImportProject.processPageFromCanvas(canvas);
  
    return newProject;
  }
  


  static async processPageFromCanvas(canvases) {
   
   if(!canvases.length) return []

    let pages = []
  
    try {
      canvases.map(async (canvas) => {
        let pageObj = new Page()
        let newPage = await pageObj.create(canvas)
        pages.push(newPage)
      })

      } catch (error) {
      console.log(error)
      }
      return  pages
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
 
