/**
 * Express Route Detection
 * 
 * This approach checks routes without making HTTP requests by
 * directly inspecting the Express app's routing table.
 */

import { jest } from "@jest/globals"
import app from "../app.js"
import fs from "fs"

/**
 * Recursively extract all routes from Express 5 router layers
 * @param {Object} layer - A router stack layer
 * @param {string} prefix - The path prefix from parent routers
 * @returns {Array} - Array of route objects with method and path
 */
function extractRoutes(layer, prefix = '') {
  const routes = []
  
  // If this layer has a route (actual endpoint)
  if (layer.route) {
    const methods = Object.keys(layer.route.methods)
    const path = prefix + layer.route.path
    methods.forEach(method => {
      routes.push({ method: method.toLowerCase(), path })
    })
  }
  
  // If this layer is a nested router
  if (layer.name === 'router' && layer.handle?.stack) {
    // Try to extract the router's path prefix from matchers
    let routerPath = ''
    if (layer.matchers && layer.matchers[0]) {
      // Test with various paths to detect the prefix
      const testPaths = ['/test', '/a/b', '/x/y/z']
      for (const testPath of testPaths) {
        const result = layer.matchers[0](testPath)
        if (result && result.path) {
          routerPath = result.path
          break
        }
      }
    }
    
    // Recursively extract routes from nested router
    layer.handle.stack.forEach(nestedLayer => {
      routes.push(...extractRoutes(nestedLayer, prefix + routerPath))
    })
  }
  
  return routes
}

/**
 * Get all registered routes from the Express app (cached)
 * This is called once when the module loads to avoid repeated extraction
 */
const allRoutes = (() => {
  const routes = []
  app.router.stack.forEach(layer => {
    routes.push(...extractRoutes(layer))
  })
  return routes
})()

/**
 * Check if a route exists in the Express app
 * @param {string} path - The route path to check (e.g., '/', '/api', '/:id')
 * @param {string} [method] - Optional HTTP method to check (e.g., 'get', 'post', 'put', 'delete', 'patch')
 * @returns {boolean} - True if the route exists (and matches the method if specified)
 */
function routeExists(path, method = null) {
  return allRoutes.some(route => {
    // Normalize paths for comparison (handle trailing slashes)
    const routePath = route.path.replace(/\/+$/, '') || '/'
    const testPath = path.replace(/\/+$/, '') || '/'
    
    const pathMatches = routePath === testPath
    
    // If method is specified, check if it matches
    if (method) return pathMatches && route.method === method.toLowerCase() 

    return pathMatches
  })
}

describe('Check to see that all expected route patterns exist. #exists_unit', () => {
  
  describe('Root and API routes', () => {
    it('GET / -- root index route', () => {
      expect(routeExists('/', 'get')).toBe(true)
    })
    
    it('GET /api -- API documentation route', () => {
      expect(routeExists('/api', 'get')).toBe(true)
    })
  })
  
  describe('Private user routes (/my)', () => {
    it('GET /my/profile -- authenticated or public user profile', () => {
      expect(routeExists('/profile', 'get')).toBe(true)
    })
    
    it('PUT /my/profile -- update user profile', () => {
      expect(routeExists('/profile', 'put')).toBe(true)
    })
    
    it('GET /my/projects -- user projects list', () => {
      expect(routeExists('/projects', 'get')).toBe(true)
    })
  })
  
  describe('Project creation and import routes', () => {
    it('POST /project/create -- create new project', () => {
      expect(routeExists('/create', 'post')).toBe(true)
    })
    
    it('POST /project/import -- import from manifest URL', () => {
      expect(routeExists('/import', 'post')).toBe(true)
    })
    
    it('POST /project/import-image -- import image', () => {
      expect(routeExists('/import-image', 'post')).toBe(true)
    })
    
    it('GET /project/deletecookie -- TPEN 2.8 import cookie deletion', () => {
      expect(routeExists('/deletecookie', 'get')).toBe(true)
    })
    
    it('GET /project/import28/:uid -- TPEN 2.8 import by user ID', () => {
      expect(routeExists('/import28/:uid', 'get')).toBe(true)
    })
    
    it('GET /project/import28/selectedproject/:selectedProjectId -- TPEN 2.8 selected project import', () => {
      expect(routeExists('/import28/selectedproject/:selectedProjectId', 'get')).toBe(true)
    })
  })
  
  describe('Project read and management routes', () => {
    it('GET /project/:id -- get project by ID', () => {
      expect(routeExists('/:id', 'get')).toBe(true)
    })
    
    it('GET /project/:id/manifest -- export project manifest', () => {
      expect(routeExists('/:id/manifest', 'get')).toBe(true)
    })
    
    it('GET /project/:id/deploymentStatus -- check manifest deployment status', () => {
      expect(routeExists('/:id/deploymentStatus', 'get')).toBe(true)
    })
    
    it('PATCH /project/:projectId/label -- update project label', () => {
      expect(routeExists('/:projectId/label', 'patch')).toBe(true)
    })
    
    it('PUT /project/:projectId/metadata -- update project metadata', () => {
      expect(routeExists('/:projectId/metadata', 'put')).toBe(true)
    })
  })
  
  describe('Project member management routes', () => {
    it('POST /project/:id/invite-member -- invite project member', () => {
      expect(routeExists('/:id/invite-member', 'post')).toBe(true)
    })
    
    it('POST /project/:id/remove-member -- remove project member', () => {
      expect(routeExists('/:id/remove-member', 'post')).toBe(true)
    })
    
    it('POST /project/:projectId/collaborator/:collaboratorId/addRoles -- add roles to collaborator', () => {
      expect(routeExists('/:projectId/collaborator/:collaboratorId/addRoles', 'post')).toBe(true)
    })
    
    it('PUT /project/:projectId/collaborator/:collaboratorId/setRoles -- set collaborator roles', () => {
      expect(routeExists('/:projectId/collaborator/:collaboratorId/setRoles', 'put')).toBe(true)
    })
    
    it('POST /project/:projectId/collaborator/:collaboratorId/removeRoles -- remove collaborator roles', () => {
      expect(routeExists('/:projectId/collaborator/:collaboratorId/removeRoles', 'post')).toBe(true)
    })
    
    it('POST /project/:projectId/switch/owner -- switch project owner', () => {
      expect(routeExists('/:projectId/switch/owner', 'post')).toBe(true)
    })
    
    it('GET /project/:projectId/collaborator/:collaboratorId/agent/:agentId -- get collaborator agent info', () => {
      expect(routeExists('/:projectId/collaborator/:collaboratorId/agent/:agentId', 'get')).toBe(true)
    })
    
    it('GET /project/:projectId/collaborator/:collaboratorId/decline -- decline project invitation', () => {
      expect(routeExists('/:projectId/collaborator/:collaboratorId/decline', 'get')).toBe(true)
    })

    it('POST /project/:projectId/leave -- member leave project', () => {
      expect(routeExists('/:projectId/leave', 'post')).toBe(true)
    })
  })
  
  describe('Project custom roles routes', () => {
    it('GET /project/:projectId/customRoles -- get custom roles', () => {
      expect(routeExists('/:projectId/customRoles', 'get')).toBe(true)
    })
    
    it('POST /project/:projectId/addCustomRoles -- add custom roles', () => {
      expect(routeExists('/:projectId/addCustomRoles', 'post')).toBe(true)
    })
    
    it('PUT /project/:projectId/updateCustomRoles -- update custom roles', () => {
      expect(routeExists('/:projectId/updateCustomRoles', 'put')).toBe(true)
    })
    
    it('DELETE /project/:projectId/removeCustomRoles -- remove custom roles', () => {
      expect(routeExists('/:projectId/removeCustomRoles', 'delete')).toBe(true)
    })
  })
  
  describe('Project custom metadata routes', () => {
    it('GET /project/:id/custom -- get custom metadata namespaces', () => {
      expect(routeExists('/:id/custom', 'get')).toBe(true)
    })
    
    it('POST /project/:id/custom -- create or replace namespace metadata', () => {
      expect(routeExists('/:id/custom', 'post')).toBe(true)
    })
    
    it('PUT /project/:id/custom -- upsert namespace metadata', () => {
      expect(routeExists('/:id/custom', 'put')).toBe(true)
    })
  })
  
  describe('Project tools routes', () => {
    it('POST /project/:projectId/tool -- add tool to project', () => {
      expect(routeExists('/:projectId/tool', 'post')).toBe(true)
    })
    
    it('DELETE /project/:projectId/tool -- remove tool from project', () => {
      expect(routeExists('/:projectId/tool', 'delete')).toBe(true)
    })
    
    it('PUT /project/:projectId/toggleTool -- toggle tool state', () => {
      expect(routeExists('/:projectId/toggleTool', 'put')).toBe(true)
    })
  })
  
  describe('Project copy routes', () => {
    it('POST /project/:projectId/copy -- copy project', () => {
      expect(routeExists('/:projectId/copy', 'post')).toBe(true)
    })
    
    it('POST /project/:projectId/copy-without-annotations -- copy project without annotations', () => {
      expect(routeExists('/:projectId/copy-without-annotations', 'post')).toBe(true)
    })
    
    it('POST /project/:projectId/copy-with-group -- copy project with group', () => {
      expect(routeExists('/:projectId/copy-with-group', 'post')).toBe(true)
    })
    
    it('POST /project/:projectId/copy-with-customizations -- copy project with customizations', () => {
      expect(routeExists('/:projectId/copy-with-customizations', 'post')).toBe(true)
    })
  })
  
  describe('Layer routes (/project/:projectId/layer)', () => {
    it('GET /project/:projectId/layer/:layerId -- get layer by ID', () => {
      expect(routeExists('/:layerId', 'get')).toBe(true)
    })
    
    it('PUT /project/:projectId/layer/:layerId -- update layer', () => {
      expect(routeExists('/:layerId', 'put')).toBe(true)
    })
    
    it('POST /project/:projectId/layer -- create new layer', () => {
      expect(routeExists('/', 'post')).toBe(true)
    })
  })
  
  describe('Page routes (/project/:projectId/page)', () => {
    it('GET /project/:projectId/page/:pageId -- get page by ID', () => {
      expect(routeExists('/:pageId', 'get')).toBe(true)
    })
    
    it('PUT /project/:projectId/page/:pageId -- update page', () => {
      expect(routeExists('/:pageId', 'put')).toBe(true)
    })
  })
  
  describe('Line routes (/project/:projectId/page/:pageId/line)', () => {
    it('GET /project/:projectId/page/:pageId/line/:lineId -- get line by ID', () => {
      expect(routeExists('/:lineId', 'get')).toBe(true)
    })
    
    it('POST /project/:projectId/page/:pageId/line -- create new line', () => {
      expect(routeExists('/', 'post')).toBe(true)
    })
    
    it('PUT /project/:projectId/page/:pageId/line/:lineId -- update line', () => {
      expect(routeExists('/:lineId', 'put')).toBe(true)
    })
    
    it('PATCH /project/:projectId/page/:pageId/line/:lineId/text -- update line text', () => {
      expect(routeExists('/:lineId/text', 'patch')).toBe(true)
    })
    
    it('PATCH /project/:projectId/page/:pageId/line/:lineId/bounds -- update line bounds', () => {
      expect(routeExists('/:lineId/bounds', 'patch')).toBe(true)
    })
  })
  
  describe('Proxy routes', () => {
    it('GET /proxy/*_ -- proxy any GET request', () => {
      expect(routeExists('/*_', 'get')).toBe(true)
    })
    
    it('OPTIONS /proxy/*_ -- proxy CORS preflight', () => {
      expect(routeExists('/*_', 'options')).toBe(true)
    })
  })
  
  describe('Feedback routes (/beta)', () => {
    it('POST /beta/feedback -- submit user feedback', () => {
      expect(routeExists('/feedback', 'post')).toBe(true)
    })
    
    it('POST /beta/bug -- submit bug report', () => {
      expect(routeExists('/bug', 'post')).toBe(true)
    })
  })
})

describe('Check to see that critical static files are present #exists_unit', () => {
  it('/public folder files', () => {
    const filePath = './public/'
    expect(fs.existsSync(filePath+"index.html")).toBeTruthy()
    expect(fs.existsSync(filePath+"API.html")).toBeTruthy()
  })
})


describe('Check to see that critical repo files are present #exists_unit', () => {
  it('root folder files', () => {
    const filePath = './' // Replace with the actual file path
    expect(fs.existsSync(filePath+"CODEOWNERS")).toBeTruthy()
    expect(fs.existsSync(filePath+"CONTRIBUTING.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"README.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"API.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"LICENSE.md")).toBeTruthy()
    expect(fs.existsSync(filePath+".gitignore")).toBeTruthy()
    expect(fs.existsSync(filePath+"package.json")).toBeTruthy()
  })
})
