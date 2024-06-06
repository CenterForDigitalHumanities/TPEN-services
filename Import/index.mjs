import {Manifest} from "manifesto.js"
import dbDriver from "../database/driver.mjs"

const database = new dbDriver("mongo")

export class Project {
  constructor(data) {
    this.data = data
  }

  async create(payload) {
    return database
      .save({...payload, "@type": "Project"})
      .then((savedProject) => {
        return savedProject
      })
  }

  static async fetchManifest(manifestId) {
    const url = `https://t-pen.org/TPEN/project/${projectId}`
    return fetch(url).then((response) => {
      return response.json()
    })
  }

  static async processManifest(manifestId) {
    return Project.fetchManifest(manifestId)
      .then((manifest) => {
        let newProject = {}
        newProject.title = manifest.title
        newProject.label = manifest.label
        newProject.metadata = manifest.metadata
        newProject.pages = manifest.items ?? manifest.sequences

        return newProject
      })
      .catch((err) => {
        console.log(err)
      })
  }

  static async importProject(manifestId) {
    return Project.fetchManifest(manifestId)
      .then((manifest) => {
        return Project.processManifest(manifest)
      })
      .then(async (project) => {
        const projectObj = new Project(project)
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
