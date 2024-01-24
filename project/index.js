/* GET a TPEN3 project manifest.  Returns Bad Request if the project id is not provided. */

var express = require('express')
var router = express.Router()
const man = {
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

router.get('/:_id', function(req, res, next) {
   res.set("Content-Type", "application/json; charset=utf-8")
   res.location(man["@id"])
   res.json(man)
})

router.get('/', function(req, res, next) {
  res.status(400).send('Improper request.  There was no project ID.')
})

router.all((req, res, next) => {
   res.status(405).send('Improper request method, please use GET.')
})

module.exports = router