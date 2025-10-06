import request from "supertest"
import { jest } from "@jest/globals"
import app from "../app.js"
import fs from 'fs'

/**
 * Express 5 Route Detection
 * 
 * Key changes from Express 4 to Express 5:
 * 1. Router is accessed via app.router (not app._router)
 * 2. Layers use 'matchers' array instead of 'regexp' property
 * 3. Each matcher is a function that tests if a path matches
 * 4. Matchers return match info including path and params, or false
 * 
 * This approach checks routes without making HTTP requests by
 * directly inspecting the Express app's routing table.
 */
let app_stack = app.router.stack

/**
 * Helper function to check if a route exists in Express 5
 * In Express 5, layers use 'matchers' instead of 'regexp'
 * @param {Array} stack - The router stack to search
 * @param {string} testPath - The path to test for
 * @returns {boolean} - True if the route exists
 */
function routeExists(stack, testPath) {
  for (const layer of stack) {
    // Check if layer has matchers (Express 5)
    if (layer.matchers && layer.matchers.length > 0) {
      const matcher = layer.matchers[0]
      const match = matcher(testPath)
      if (match && match.path) {
        return true
      }
    }
    // Also check route.path directly if it exists
    if (layer.route && layer.route.path) {
      if (layer.route.path === testPath || layer.route.path.includes(testPath)) {
        return true
      }
    }
  }
  return false
}

// TODO figure out all current route patterns in the Express app and add a test to check if they exist
describe('Check to see that all expected top level route patterns exist.', () => {
	// Here is a real example for /project/create from /project/projectCreateRouter.js
	it('/project/create -- mounted ', () => {
	    expect(routeExists(app_stack, '/project/create')).toBe(true)
	  })
})

describe('Check to see that critical static files are present', () => {
  it('/public folder files', () => {
    const filePath = './public/'
    expect(fs.existsSync(filePath+"index.html")).toBeTruthy()
    expect(fs.existsSync(filePath+"API.html")).toBeTruthy()
  })
})


describe('Check to see that critical repo files are present', () => {
  it('root folder files', () => {
    const filePath = './' // Replace with the actual file path
    expect(fs.existsSync(filePath+"CODEOWNERS")).toBeTruthy()
    expect(fs.existsSync(filePath+"CONTRIBUTING.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"README.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"API.md")).toBeTruthy()
    expect(fs.existsSync(filePath+"LICENSE")).toBeTruthy()
    expect(fs.existsSync(filePath+".gitignore")).toBeTruthy()
  })
})