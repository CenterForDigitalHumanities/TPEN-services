import express from 'express'
import * as utils from '../utilities/shared.mjs'
import cors from 'cors'
import dbController from 'db controller path' // will update the db path once the pull request of db controller is accepted 
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
      'X-HTTP-Method-Override'
    ],
    exposedHeaders: '*',
    origin: '*',
    maxAge: '600'
  })
)

const authenticateUser = (req, res, next) => {
  const bearerToken = req.headers.authorization
  if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
    return utils.respondWithError(res, 401, 'Unauthorized')
  }
  const agentId = utils.extractAgentIdFromToken(bearerToken)
  if (!agentId) {
    return utils.respondWithError(res, 401, 'Unauthorized')
  }
  req.agentId = agentId
  next()
}

// Endpoint for getting projects
router.get('/project', authenticateUser, async (req, res, next) => {
  try {
    const projects = await dbController.getUserProjects(req.agentId)
    // If projects found, respond with the projects 
    if (projects && projects.length > 0) {
      const formattedProjects = projects.map(project => ({ id: project.id, title: project.title }))
      res.status(200).json(formattedProjects)
    } else {
      res.status(404).json({ message: 'No projects found for the user' })
    }
  } catch (error) {
    console.error(error)
    return utils.respondWithError(res, 500, 'Internal Server Error')
  }
})
export default router
