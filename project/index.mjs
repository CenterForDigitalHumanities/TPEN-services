
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

router.get('/',  async (req, res, next) => {

  try {
    const mockUserFromTokenProcessing = { "id": "123", "type": "User", "other": "props" }
    let projects = await logic.getUserProjects(mockUserFromTokenProcessing, req.query)
    
    if (req.query.hasRoles !== 'All') {
      projects = projects.filter(project => project.roles && project.roles.some(role => req.query.hasRoles.includes(role)))
    }
    if (req.query.exceptRoles !== 'NONE') {
      projects = projects.filter(project => !project.roles || !project.roles.some(role => req.query.exceptRoles.includes(role)))
    }
    if (req.query.createdBefore === 'NOW') {
      const createdBeforeTimestamp = Date.now()
      projects = projects.filter(project => project.created < createdBeforeTimestamp)
    }
    if (req.query.modifiedBefore === 'NOW') {
      const modifiedBeforeTimestamp = Date.now()
      projects = projects.filter(project => project.lastModified < modifiedBeforeTimestamp)
    }
    if (req.query.count) {
      return res.status(200).json({ count: projects.length })
    }
    if (req.query.fields) {
      const filteredProjects = projects.map(project => {
        const filteredProject = {}
        req.query.fields.split(',').forEach(field => {
          filteredProject[field] = project[field]
        })
        return filteredProject
      })
      return res.status(200).json(filteredProjects)
    }
    // Default: return projects with id and title
    const defaultProjects = projects.map(project => ({ id: project.id, title: project.title }))
    return res.status(200).json(defaultProjects)
  } catch (error) {
    console.error(error)
    // Check if the error is a database-related error
    if (error.message.includes('database')) {
      return res.status(500).json({ error: 'Database error. Please try again later.' })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

router.all('/', (req, res, next) => {
  utils.respondWithError(res, 405, 'Improper request method, please use GET.')
})

export default router
