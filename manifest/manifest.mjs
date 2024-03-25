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


export async function createManifest(manifestJSON){
   return await database.create(manifestJSON)
}

export async function updateManifest(manifestJSON){
   return await database.update(manifestJSON)
}

export async function deleteManifest(manifestID){
   return await database.remove(manifestID)
}

export async function queryForManifests(manifestJSON){
   return await database.read(manifestJSON)
}

export async function findTheManifestByID(hash_id){
   // If this is a RERUM ID, we just need the const prefix + hash
   const uri = process.env.RERUMIDPREFIX+hash_id
   return {"@id":uri, "type":"Manifest"}
   // TODO just fetch the RERUM URI
   //return await fetch()
}