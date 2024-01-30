import * as utils from "../utilities/shared.mjs"

// This function is an internal util, but we may want to test it in tests so we export it here for now.
export async function findTheManifestByID(id=null){
   let manifest = null
   if(!utils.validateProjectID(id)) return manifest
   const mockPause = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve(null)
     }, 3500)
   })
   if(id){
      if(id && id===7085) {
         manifest = await fetch("https://t-pen.org/TPEN/manifest/7085").then(resp => resp.json()).catch(err => {
            console.error(err)
            return null
         })
      }
   }
   // Mock the scenario where it takes a couple seconds to look for but not find the Manifest.
   if(manifest === null){
      manifest = mockPause.then(val => {return null})
   }
   return manifest
}