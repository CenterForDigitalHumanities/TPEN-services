/** 
 * Logic for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */
import DatabaseDriver from "../database/driver.mjs"
import * as utils from "../utilities/shared.mjs"

// This module will use the TinyPEN API (RERUM Mongo DB)
const database = new DatabaseDriver("mongo")

/**
 * A full Manifest object without an ID to be created in RERUM
 * @see https://store.rerum.io/v1/API.html#create
 */
export async function saveManifest(manifestJSON){
   return await database.save(manifestJSON)
}

/**
 * A full Manifest object with an ID.  This assumes
 * the object has changed and needs to be RERUM PUT updated.
 * @see https://store.rerum.io/v1/API.html#update
 */ 
export async function updateManifest(manifestJSON){
   return await database.update(manifestJSON)
}

/**
 * The IRI of a Manifest in RERUM to RERUM delete.
 * @see https://store.rerum.io/v1/API.html#delete
 */ 
export async function deleteManifest(manifestIRI){
   return await database.delete(manifestIRI)
}

/**
 * JSON properties to query for matches against.
 * All objects matching these properties will be returned.
 * @see https://store.rerum.io/v1/API.html#query
 */ 
export async function queryForManifestsByDetails(manifestDetails){
   return await database.find(manifestDetails)
}

/**
 * Go into the database to get the Project information for the id input.
 * The Project will have a Manifest associated with it.  
 * Get that Manifest and return it.  Return null if no manifest can be produced.
 * 
 * @param id A string or number meant to be a number.
 * @return manifest A JSON object that is a Manifest or null.
 */ 
export async function findTheManifestByProjectID(id=null){
   // A bad ID will not find a Project, therefore not a Manifest either.
   if(!utils.validateID(id)) return null
   return {"@context":"TODO", "@id": "https://store.rerum.io/v1/id/123test456manifest", "type":"Manifest", "label":{"en":["A Manifest Stub"]}, "tpenProject":id}
   // Either a Manifest exists in RERUM that knows this project id
   //return await queryForManifestByDetails({"tpenProject": id})
   // Or a Project in our database knows the manifest ID
   //const proj = await new Project(id)
   //return proj.getManifest()
}
