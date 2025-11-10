# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TPEN Services is the backend API for TPEN3 (Transcription for Paleographical and Editorial Notation), a web-based tool for transcribing and annotating digital manuscripts. This Node.js/Express API provides:

- **IIIF-compliant** annotation services following W3C Web Annotation standards
- **Multi-user collaboration** with role-based access control
- **Persistent storage** of transcriptions via RERUM/TinyThings
- **Project management** for organizing manuscript transcription work
- **RESTful API** endpoints for frontend applications

The service acts as a middleware layer between TPEN3 frontends and multiple data storage backends (MongoDB for metadata, RERUM for annotations).

## Tech Stack

### Core Technologies
- **Node.js**: >= 22.20.0 (REQUIRED - uses modern JS features)
- **Express**: 5.1.0 - Web framework
- **MongoDB**: 6.20.0 - Primary database for projects, users, groups
- **RERUM/TinyThings**: External service for persistent annotation storage

### Key Dependencies
- **Auth0**: JWT-based authentication via express-oauth2-jwt-bearer
- **IIIF**: @iiif/helpers for Presentation API support
- **DOMPurify**: XSS protection for user input
- **Jest**: Testing framework with Supertest for API testing

## Project Structure

```
/
├── auth/                 # Authentication middleware (Auth0 JWT validation)
├── bin/                  # Server startup script (tpen3_services.js)
├── classes/              # Core business logic classes
│   ├── Project.js       # Project CRUD and validation
│   ├── User.js          # User profile and membership
│   ├── Group.js         # Collaborator groups and permissions
│   ├── Layer.js         # Annotation layers (RERUM-backed)
│   ├── Page.js          # Annotation pages (RERUM-backed)
│   └── Line.js          # Individual annotations (RERUM-backed)
├── database/            # Database abstraction layer
│   ├── dbDriver.js      # Unified interface for all DBs
│   ├── mongo/           # MongoDB implementation
│   └── tiny/            # RERUM/TinyThings implementation
├── project/             # Project API routes
├── userProfile/         # User profile routes
├── utilities/           # Shared utilities and helpers
└── __tests__/           # Test suites
```

## Core Concepts

### Projects
- Container for manuscript transcription work
- Contains layers, manifests, metadata, and tools
- Linked to a Group for access control
- Identified by MongoDB ObjectId

### Layers
- Logical groupings of annotations (e.g., "Transcription", "Translation")
- Stored in RERUM as AnnotationCollections
- Contains Pages which contain Lines

### Pages
- Represents annotations for a single manuscript page/canvas
- Stored as AnnotationPages in RERUM
- Linked to IIIF canvas URIs

### Lines
- Individual annotations/transcriptions
- Stored as Web Annotations in RERUM
- Target specific regions on manuscript images

### Groups
- Manage project membership and permissions
- Support custom roles beyond OWNER/CONTRIBUTOR/VIEWER
- Control who can edit, view, or manage projects

## API Architecture

### RESTful Conventions
```javascript
GET    /project/:id              // Retrieve resource
POST   /project/create           // Create new resource
PUT    /project/:id              // Update resource
DELETE /project/:id              // Delete resource
```

### Response Patterns
```javascript
// Success
res.status(200).json(data)

// Error
res.status(400).json({ error: "message" })

// No content
res.status(204).send()
```

### Common Status Codes
- 200: Success
- 201: Created
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Server Error

## Database Strategy

### MongoDB (Primary Storage)
- Projects, Users, Groups, HotKeys collections
- Handles metadata, relationships, and configuration
- ObjectId-based identification

### RERUM/TinyThings (Annotation Storage)
- Persistent, versioned annotation storage
- Returns stable URIs for annotations
- Handles Layers, Pages, Lines as JSON-LD
- Accessed via HTTP API

### Database Abstraction
```javascript
// Always use the abstraction layer
const database = new dbDriver("mongo")
await database.save(data, "projects")
await database.findOne({ _id: id }, "projects")
```

## Authentication & Authorization

### Authentication Flow
1. Client sends JWT in `Authorization: Bearer <token>`
2. `auth0Middleware()` validates token with Auth0
3. User agent extracted from token claims
4. User record loaded/created from database

### Authorization Model
```javascript
// Default roles
OWNER       // Full control, can transfer ownership
CONTRIBUTOR // Can edit content
VIEWER      // Read-only access

// Permission checking
Project.checkUserAccess(userId, "edit_page", "layer", layerId)
```

### Protected Routes
```javascript
router.post("/path", auth0Middleware(), async (req, res) => {
  const userId = req.user._id
  // Route handler
})
```

## Development Workflow

### Getting Started
```bash
# Install dependencies
npm install

# Set up environment
cp sample.env .env
# Edit .env with your configuration

# Start development server
npm run dev

# Run tests
npm test
```

### Environment Variables
```
# Essential for development
PORT=3001
MONGODB=mongodb://localhost:27017
MONGODBNAME=tpen3
RERUMURL=https://store.rerum.io/v1
AUDIENCE=https://yourapp.auth0.com/api
DOMAIN=yourapp.auth0.com
```

### Making Changes

1. **Follow existing patterns** - Look at similar code for guidance
2. **Use the abstraction layers** - Don't access databases directly
3. **Validate input** - Use utility validators in `/utilities`
4. **Handle errors gracefully** - Use respondWithError() helper
5. **Write tests** - Add tests for new functionality

## Testing Guidelines

### Running Tests
```bash
npm run allTests        # All tests
npm run unitTests       # Unit tests only
npm run E2Etests        # End-to-end tests
npm run dbTests         # Database tests
```

### Test Organization
- Tag tests with descriptive labels (e.g., `user_class`, `auth_test`)
- Use Supertest for API endpoint testing
- Mock external services when appropriate
- Tests should be independent and idempotent

## Code Style & Conventions

### JavaScript Style
```javascript
// ES6+ modules
import { something } from './module.js'

// Async/await for all async operations
async function processData() {
  const result = await database.find({}, "collection")
  return result
}

// Early returns with guard clauses
if (!isValid) {
  return respondWithError(res, 400, "Invalid input")
}

// Nullish coalescing and optional chaining
const value = data?.property ?? defaultValue
```

### Naming Conventions
- Files: camelCase.js
- Classes: PascalCase
- Functions/variables: camelCase
- Routes: kebab-case
- Database collections: UPPERCASE

### Commit Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
test: Add tests
refactor: Refactor code
```

## Security Considerations

### Input Validation
```javascript
// Always sanitize user input
import DOMPurify from 'isomorphic-dompurify'
const clean = DOMPurify.sanitize(userInput)

// Check for suspicious content
if (checkIfSuspicious(content)) {
  throw new Error("Suspicious content detected")
}
```

### Authentication Required
- All write operations require valid JWT
- User permissions checked before data modifications
- Ownership verified for sensitive operations

### CORS Configuration
- Configured per endpoint as needed
- Default CORS settings in common_cors.json
- Restrictive by default

## Common Tasks

### Adding a New API Endpoint
1. Create route file in appropriate directory
2. Define route with authentication middleware
3. Implement business logic in classes/
4. Add validation and error handling
5. Write tests for the endpoint

### Working with Projects
```javascript
// Load a project
const project = new Project(projectId)
await project.load()

// Check user access
const canEdit = await project.checkUserAccess(userId, "edit", "project")

// Update project
project.title = "New Title"
await project.save()
```

### Working with Annotations
```javascript
// Create a new annotation page
const page = new Page({
  label: "Page 1",
  target: canvasUri
})
await page.save()

// Add to layer
layer.pages.push(page.id)
await layer.save()
```

### Database Operations
```javascript
// Always use the driver abstraction
const db = new dbDriver("mongo")

// Find documents
const projects = await db.find({ creator: userId }, "projects")

// Update document
await db.update({ _id: id, ...updates }, "projects")
```

### Testing Your Changes
```javascript
// Write a test for your feature
describe('My Feature', () => {
  test('should do something', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'test' })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('result')
  })
})
```

## Important Notes

1. **RERUM Integration**: Annotation data is stored externally in RERUM. Always handle RERUM API failures gracefully.

2. **MongoDB Required**: While MariaDB support exists, MongoDB is the primary database and required for full functionality.

3. **IIIF Compliance**: All annotation responses follow IIIF Presentation API 3.0 and W3C Web Annotation standards.

4. **Async Everything**: All database operations and external API calls must use async/await.

5. **Token Expiry**: Always check JWT expiration before processing requests.

6. **Maintenance Mode**: Check `DOWN` environment variable for maintenance mode handling.

## Need Help?

- Check existing implementations in similar files
- Review test files for usage examples
- Look at utility functions in `/utilities` for common operations
- Follow patterns established in the `/classes` directory