/** 
 * Logic for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */
import fetch from 'node-fetch'
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
   // Since this relates to a RERUM resource, we just need the IRI (const prefix + hash) and we can fetch it.
   // No need to query through TinyPEN (database) for this, but we could like {"_id": hash_id}
   const manifestIRI = process.env.RERUMIDPREFIX+hash_id
   return await fetch(manifestIRI).then(res => res.json()).catch(err => {return err})
}