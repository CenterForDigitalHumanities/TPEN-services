import {Manifest} from "manifesto.js"
import dbDriver from "../database/driver.mjs"

const database = new dbDriver("mongo")

export class Project {
  constructor(data) {
    this.data = data
  }

  async save() {
    return database
      .save({...this.data, "@type": "Project"})
      .then((savedProject) => {
       
        return savedProject
      }) 
  }

  static async fetchManifest(projectId) {
    const url = `https://t-pen.org/TPEN/project/${projectId}`
    return fetch(url)
      .then((response) => {
        return response.json()
      })
   }

  static async processManifest(projectId) { 
    return Project.fetchManifest(projectId).then((manifest) => { 
       // Process manifest into new Project
      //Return newProject
      // UNDER CONSTRUCTION

      let newProject = {}

      const iiifManifest = new Manifest(manifest["@id"]) 
      const sequences = iiifManifest.getSequences()

      newProject.sequences = sequences
      newProject.metadata = iiifManifest.getMetadata()
      newProject.label = iiifManifest.getLabel()

    
      return newProject
    }).catch((err)=>{
      console.log(err)
    })


  }

  static async importProject(projectId) {
    return Project.fetchManifest(projectId)
      .then((manifest) => { 
        return Project.processManifest(manifest)
      })
      .then((newManifest) => {
        const project = new Project(newManifest)
        return project.save()
      })
      .then((savedProject) => {
        console.log("Project imported successfully:", savedProject)
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