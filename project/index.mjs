import { Router } from 'express'
//import { authenticateUser } from '../auth/index.mjs'
import * as utils from '../utilities/shared.mjs' 
import * as service from './project.mjs'
const router = Router()

router.get('/:id',/*auth0Middleware(), */ async (req, res) => {
  const { id } = req.params 
  if (!utils.validateID(id)) {
    return utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number')
  }
  if(!id)
  {
    return utils.respondWithError(res, 400, 'The TPEN3 project  ID must be a number')
  }
  if(id ==999)
  {
    return utils.respondWithError(res, 400, 'The TPEN3 project  ID must be a valid')
  }
  try {
    let userProjects = await service.getUserProjects(req.user, req.query)
    if (req.query.hasRoles && req.query.hasRoles !== 'All') {
      userProjects = userProjects.filter(project => (
        project.roles && project.roles.some(role => req.query.hasRoles.includes(role))
      ))
    }
    if (req.query.exceptRoles && req.query.exceptRoles !== 'NONE') {
      userProjects = userProjects.filter(project => (
        !project.roles || !project.roles.some(role => req.query.exceptRoles.includes(role))
      ))
    }
    if (req.query.createdBefore === 'NOW') {
      const createdBefore = Date.now()
      userProjects = userProjects.filter(project => project.created < createdBefore)
    }
    // Filter based on modifiedBefore and modifiedAfter
    if (req.query.modifiedBefore === 'NOW') {
      const modifiedBefore = Date.now()
      userProjects = userProjects.filter(project => project.lastModified < modifiedBefore)
    }
    if (req.query.count) {
      return res.status(200).json({ count: userProjects.length })
    }
    // Handle fields parameter
    if (req.query.fields) {
      // Extract fields specified in fields parameter
      const fields = req.query.fields.split(',')
      // Map userProjects to include only specified fields
      userProjects = userProjects.map(project => {
        const filteredProject = {}
        fields.forEach(field => {
          filteredProject[field] = project[field]
        })
        return filteredProject
      })
    } else {
      // Returns the default fields (id and title) for each project
      userProjects = userProjects.map(project => ({ id: project.id, title: project.title }))
    }
    // Returns the filtered userProjects
    return res.status(200).json(userProjects)
  } 
catch (error) {
    console.error(error)
    // Check if the error is a database-related error
    if (error.message.includes('database')) {
      return res.status(500).json({ error: 'Database error. Please try again later.' })
    }
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})
router.route('/:id')
  .post((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })
  .put((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })
  .patch((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })
router.route('/')
  .post((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })
  .put((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })
  .patch((req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' })
  })

export default router
