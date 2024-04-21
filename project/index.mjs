
import express from 'express'
import * as utils from '../utilities/shared.mjs'
import * as logic from './project.mjs'
import cors from 'cors'

let router = express.Router()

router.use(
  cors({
    methods: 'GET',
    allowedHeaders: [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override',
    ],
    exposedHeaders: '*',
    origin: '*',
    maxAge: '600',
  })
)

export function respondWithProject(req, res, project) {
  const id = project['@id'] ?? project.id ?? null

  let textType = req.query.text
  let image = req.query.image
  let lookup = req.query.lookup
  let view = req.query.view

  let passedQueries = [textType, image, lookup, view].filter(elem => elem !== undefined)
  let responseType = null
  if (passedQueries.length > 1) {
    utils.respondWithError(res, 400, 'Improper request. Only one response type may be queried.')
    return
  } else if (passedQueries.length === 1) {
    responseType = passedQueries[0]
  }

  let embed = req.query.embed

  let retVal
  switch (responseType) {
    case textType:
      switch (textType) {
        case 'blob':
          res.set('Content-Type', 'text/plain; charset=utf-8')
          retVal = 'mock text'
          break
        case 'layers':
          res.set('Content-Type', 'application/json; charset=utf-8')
          retVal = [{ name: 'Layer.name', id: '#AnnotationCollectionId', textContent: 'concatenated blob' }]
          break
        case 'pages':
          res.set('Content-Type', 'application/json; charset=utf-8')
          retVal = [{ name: 'Page.name', id: '#AnnotationPageId', textContent: 'concatenated blob' }]
          break
        case 'lines':
          res.set('Content-Type', 'application/json; charset=utf-8')
          retVal = [
            {
              name: 'Page.name',
              id: '#AnnotationPageId',
              textContent: [{ id: '#AnnotationId', textualBody: 'single annotation content' }],
            },
          ]
          break
        default:
          utils.respondWithError(res, 400, 'Improper request.  Parameter "text" must be "blob," "layers," "pages," or "lines."')
          break
      }
      break

    case image:
      switch (image) {
        case 'thumb':
          res.set('Content-Type', 'text/uri-list; charset=utf-8')
          retVal = 'https://example.com'
          break
        default:
          utils.respondWithError(res, 400, 'Improper request.  Parameter "image" must be "thumbnail."')
          break
      }
      break

    case lookup:
      switch (lookup) {
        case 'manifest':
          retVal = {
            '@context': 'http://iiif.io/api/presentation/2/context.json',
            '@id': 'https://t-pen.org/TPEN/manifest/7085/manifest.json',
            '@type': 'sc:Manifest',
            label: 'Ct Interlinear Glosses Mt 5',
          }
          break
        default:
          utils.respondWithError(res, 400, 'Improper request.  Parameter "lookup" must be "manifest."')
          break
      }
      break

    case view:
      switch (view) {
        case 'xml':
          res.set('Content-Type', 'text/xml; charset=utf-8')
          retVal = '<xml><id>7085</id></xml>'
          break
        case 'html':
          res.set('Content-Type', 'text/html; charset=utf-8')
          retVal = '<html><body> <pre tpenid="7085"> {"id": "7085", ...}</pre>  </body></html>'
          break
        case 'json':
          break
        default:
          utils.respondWithError(res, 400, 'Improper request.  Parameter "view" must be "json," "xml," or "html."')
          break
      }
      break

    default:
      res.set('Content-Type', 'application/json; charset=utf-8')
      res.location(id)
      res.status(200)
      res.json(project)
      return
  }

  res.location(id).status(200).send(retVal)
}

router.get('/:id', async (req, res, next) => {
  let id = req.params.id
  if (!utils.validateID(id)) {
    utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number')
    return
  }
  id = parseInt(id)

  try {
    const projectObj = await logic.findTheProjectByID(id)
    if (projectObj) {
      respondWithProject(req, res, projectObj)
    } else {
      utils.respondWithError(res, 404, `TPEN3 project "${req.params.id}" does not exist.`)
    }
  } catch (err) {
    utils.respondWithError(res, 500, 'The TPEN3 server encountered an internal error.')
  }
})

router.all('/', (req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})

const addLayersValidator = (req, res, next) => {
  if(!req.params.id){
    utils.respondWithError(res, 400, 'Bad Request: The TPEN3 project ID provided is null. Please provide a valid project ID.')
    return
  }
  const { label, creator, items } = req.body
  if (!label || !creator || !items) {
    utils.respondWithError(res, 400, 'Bad Request: The request body must contain label, creator, and items fields.')
    return
  }
  next()
}

router.route('/:id/addLayer')
  .post(addLayersValidator, async (req, res, next) => {
    const id = req.params.id
    const { label, creator, items } = req.body
    const annotationCollection = await logic.AnnotationCollectionFactory(label, creator, items)
    const response = await logic.saveAnnotationCollection(annotationCollection)
    const projectsArray = await logic.findTheProjectUsingID(id)
    if(projectsArray.length <= 0) {
      utils.respondWithError(res, 404, 'Project not found with ID: ' + id + 'The annotation is saved in Annotation collection with id: ' + response.id)
    }
    const project =  projectsArray[0]
    try{
      logic.updateProjectLayers(project, annotationCollection.id)
    }catch(error){
      utils.respondWithError(res, 500, 'Annotation collection is added with id ' + annotationCollection.id 
      + 'but failed to update the project layers.Error caused : ' + error.message)
    }
    res.status(201).json(response)
}).all((req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use POST.')
})

export default router
