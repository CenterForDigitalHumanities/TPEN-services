/* GET a TPEN3 project manifest.  Returns Bad Request if the project id is not provided. */

import express from 'express'
let router = express.Router()
const manifestFromDatabase = {
   "@context":"http://iiif.io/api/presentation/2/context.json",
   "@id":"https://t-pen.org/TPEN/manifest/7085/manifest.json",
   "@type":"sc:Manifest",
   "label":"Ct Interlinear Glosses Mt 5",
   "metadata":[
      {
         "label":"title",
         "value":"TPEN3 Test Manifest"
      }
   ],
   "sequences":[
      {
         "@id":"https://t-pen.org/TPEN/manifest/7085/sequence/normal",
         "@type":"sc:Sequence",
         "label":"Current Page Order",
         "canvases":[
            {
               "@id":"https://t-pen.org/TPEN/canvas/13248868",
               "@type":"sc:Canvas",
               "label":"f010v-f011r",
               "width":1320,
               "height":1000,
               "images":[
                  {
                     "@type":"oa:Annotation",
                     "motivation":"sc:painting",
                     "resource":{
                        "@id":"https://trin-digital-library.trin.cam.ac.uk/iiif/2/B.1.10%2F013_B.1.10_f010v-f011r.jpg/full/full/0/default.jpg",
                        "@type":"dctypes:Image",
                        "format":"image/jpeg",
                        "width":4136,
                        "height":3131
                     },
                     "on":"https://t-pen.org/TPEN/canvas/13248868"
                  }
               ]
            }
         ]
      }
   ]
}

// This function is an internal util, but we may want to test it in tests so we export it here for now.
function validateProjectID(id){
   if(id){
      try{
         id = parseInt(id)
      }
      catch(err){
         console.error(err)
         return false
      }
      return true   
   } 
   return false
}

// This function is an internal util, but we may want to test it in tests so we export it here for now.
function findTheManifestById(id){
   if(id && id===7085) {return man}
   return null
}

// Route performs the job
router.route('/:id')
   .get((req, res, next) => {
      if(!validateProjectID(req.params.id)){
         res.status(400).send('The TPEN3 project ID must be a number')
         return
      }
      const manifestObj = findTheManifestById(req.params.id)
      if(manifestObj){
         res.set("Content-Type", "application/json; charset=utf-8")
         res.location(man["@id"])
         res.status(200)
         res.json(manifestObj)
      }
      else{
         res.status(404).send(`TPEN 3 project "${req.params.id}" does not exist.`)
      }
   })
   .all((req, res, next) => {
      res.status(405).send('Improper request method, please use GET.')
   })


// Router is set up correctly...
router.route('/')
   .get((req, res, next) => {
      res.status(400).send('Improper request.  There was no project ID.')
   })
   .all((req, res, next) => {
      res.status(405).send('Improper request method, please use GET.')
   })

export {router as default, validateProjectID as validateProjectID, findTheManifestById as findTheManifestById}