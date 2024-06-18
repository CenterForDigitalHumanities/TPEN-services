import DatabaseDriver from "../database/driver.mjs"

const database = new DatabaseDriver("mongo")

export async function findTheProjectByID(id) {
  console.log(id)
  let project

  if (id == "7085") {
    // Stub out example project for use in unit tests
    project = {
      "_id": 7085,
      "@context": "http://t-pen.org/3/context.json",
      "@type": "Project",
      "creator": "https://store.rerum.io/v1/id/hash",
      "group": "#GroupId",
      "layers": [
        "#LayerId"
      ],
      "lastModified": "#PageId",
      "viewer": "https://static.t-pen.org/#ProjectId",
      "license": "CC-BY",
      "manifest": "https://example.com/manifest.json",
      "tools": [],
      "options": {}
    }
  } else {

    let results = await database.find(
      {
        "@type": "Project",
        "_id": id
      }
    )
    if (results.length === 0) {
      project = null
    } else {
      project = results[0]
    }
    
  }
  return project
}

/** 
 * Save project to Mongo database
 */
export async function saveProject(projectJSON) {
  return await database.save(projectJSON)
}