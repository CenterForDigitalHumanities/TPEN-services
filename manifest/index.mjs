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
export function validateProjectID(id){
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
export function findTheManifestById(id=null){
   if(id && id===7085) {return manifestFromDatabase}
   return null
}

// Send a successful response with the appropriate JSON
export function respondWithJSON(res, json){
   const id = json["@id"] ?? json.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(id)
   res.status(200)
   res.json(json)
}

// Send a failure response with the proper code and message
export function respondWithError(res, status, message ){
   res.status(status).send(message)
}

// Route performs the job
router.route('/:id')
   .get((req, res, next) => {
      if(!validateProjectID(req.params.id)){
         respondWithError(res, 400, 'The TPEN3 project ID must be a number')
      }
      const manifestObj = findTheManifestById(req.params.id)
      if(manifestObj){
         respondWithJSON(res, manifestObj)
      }
      else{
         respondWithError(res, 404, `TPEN 3 project "${req.params.id}" does not exist.`)
      }
   })
   .all((req, res, next) => {
      respondWithError(res, 405, 'Improper request method, please use GET.')
   })


// Router is set up correctly...
router.route('/')
   .get((req, res, next) => {
      respondWithError(res, 400, 'Improper request.  There was no project ID.')
   })
   .all((req, res, next) => {
      respondWithError(res, 405, 'Improper request method, please use GET.')
   })

export {router as default}