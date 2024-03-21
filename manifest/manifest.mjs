/** 
 * Logic for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import Database from "../database/polyController.mjs"
import * as utils from "../utilities/shared.mjs"

const database = new Database()
database.chooseController("tiny")

/**
 * Go into the database to get the Project information for the id input.
 * The Project will have a Manifest associated with it.  
 * Get that Manifest and return it.  Return null if no manifest can be produced.
 * 
 * @param id A string or number meant to be a number.
 * @return manifest A JSON object that is a Manifest or null.
 */ 
export async function findTheManifestByID(id=null){
   let manifest = null
   // A bad ID will not find a Project, therefore not a Manifest either.
   if(!utils.validateID(id)) return manifest
   // A good ID will return JSON if there is a matching project.  Send back JSON for IDs greater than 100.
   if(id) {
      manifest = await database.getById(id)
   }
   return manifest
}

export async function createManifest(manifestJSON){
   return await database.create(manifestJSON)
}