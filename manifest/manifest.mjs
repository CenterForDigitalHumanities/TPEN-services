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

export async function queryForManifest(manifestJSON){
   return await database.read(manifestJSON)
}