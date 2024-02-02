/** Logic for the /manifest endpoint */

import * as utils from "../utilities/shared.mjs"

export async function findTheManifestByID(id=null){
   let manifest = null
   if(!utils.validateProjectID(id)) return manifest

   // Mock a pause for endpoints that fail, to mock the time it takes for some async stuff to decide it failed.
   const mockPause = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve(null)
     }, 1500)
   })

   if(id && id===7085) {
      manifest = await fetch("https://t-pen.org/TPEN/manifest/7085").then(resp => resp.json()).catch(err => {
         console.error(err)
         return null
      })
   }
   
   // Mock the scenario where it takes a couple seconds to look for but not find the Manifest.
   if(manifest === null){
      manifest = mockPause.then(val => {return null})
   }
   return manifest
}