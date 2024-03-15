/** 
 * Logic for the /manifest endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import * as utils from "../utilities/shared.mjs"

// TODO pull in a connected db controller.  It should not have to connect every time an endpoint is called.
//import MongoController from '../database/mongo/index.mjs'
//const MongoDBController = new MongoController(process.env.MONGODB)

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

   // Mock a pause for endpoints that fail, to mock the time it takes for some async stuff to decide it failed.
   const mockPause = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve(null)
     }, 1500)
   })

   // A good ID will return JSON if there is a matching project.  Send back JSON for IDs greater than 100.
   if(id && id > 100) {
      // Go get the data from the database.  
      // This fetch actually gets this particular manifest from the existing TPEN which mocks the asyncronous behavior of this action.
      manifest = await fetch("https://t-pen.org/TPEN/manifest/7085")
      .then(resp => resp.json())
      .then(man => {
         // A quick cheat which lets you know we got the id right.
         man["@id"] = `https://t-pen.org/TPEN/manifest/${id}`
         return man
      })
      .catch(err => {
         console.error(err)
         return null
      })
   }
   
   // Mock the asyncronous action of taking some seconds to look for but not find the Manifest.
   if(manifest === null){
      manifest = mockPause.then(val => {return null})
   }

   return manifest
}

// export async function createManifest(manifestJSON){
//    const created = await MongoDBController.create("test", manifestJSON)
//    return created
// }