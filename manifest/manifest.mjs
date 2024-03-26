/** 
 * Logic for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */
import fetch from 'node-fetch'
import DatabaseDriver from "../database/driver.mjs"
import * as utils from "../utilities/shared.mjs"

const database = new DatabaseDriver()
await database.chooseController("tiny")

/**
 * A full Manifest object without an ID to be created in RERUM
 * @see https://store.rerum.io/v1/API.html#create
 */
export async function createManifest(manifestJSON){
   return await database.create(manifestJSON)
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
   return await database.remove(manifestIRI)
}

/**
 * A hash id for a Manifest in RERUM.  Get the Manifest that matches this hash _id. 
 * @see https://store.rerum.io/v1/API.html#single-record-by-id
 */ 
export async function findTheManifestByID(hash_id){
   // Since this relates to a RERUM resource, we just need the IRI (const prefix + hash) and we can fetch it.
   // No need to query through TinyPEN (database) for this, but we could like {"_id": hash_id}
   const manifestIRI = process.env.RERUMIDPREFIX+hash_id
   return await fetch(manifestIRI).then(res => res.json()).catch(err => {return err})
}

/**
 * JSON properties to query for matches against.
 * All objects matching these properties will be returned.
 * @see https://store.rerum.io/v1/API.html#query
 */ 
export async function queryForManifests(manifestJSON){
   return await database.read(manifestJSON)
}
