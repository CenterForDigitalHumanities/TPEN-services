# TPEN Services

TPEN Services is a Node.js Express API service for TPEN3 (Transcription for Paleographical and Editorial Notation). This provides RESTful APIs for digital humanities, cultural heritage, annotation services, and IIIF manifest handling. The service supports multiple database backends (MongoDB, MariaDB) and uses Auth0 for authentication.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Copy environment configuration: `cp sample.env .env`
- Install dependencies: `npm install` -- takes up to 20 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Run unit tests: `npm run unitTests` -- takes 12 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Run existence tests: `npm run existsTests` -- takes 7 seconds. NEVER CANCEL. Set timeout to 30+ seconds.
- Run all tests: `npm run allTests` -- takes 12 seconds. NEVER CANCEL. Set timeout to 30+ seconds.

### Run the Application
- ALWAYS run the bootstrapping steps first.
- Production server: `npm start` -- starts on port 3001
- Development server: `npm run dev` -- starts with nodemon auto-reload on port 3001
- Test basic functionality: `curl http://localhost:3001/` should return "TPEN3 SERVICES BABY!!!"

### Environment Requirements
- Node.js >= 22.14.0 (works with v20.19.4 but shows warnings)
- MongoDB (for database tests and full functionality)
- MariaDB (for database tests and full functionality)
- Copy `sample.env` to `.env` for basic functionality
- For full functionality, configure database connection strings in `.env`

## Validation

### Always Validate Core Functionality After Changes
- Start the application: `npm start` or `npm run dev`
- Test the root endpoint: `curl http://localhost:3001/` -- should return HTML with "TPEN3 SERVICES BABY!!!"
- Run unit tests that don't require databases: `npm run unitTests` -- many tests pass without database connections
- Run existence tests: `npm run existsTests` -- validates route registration and class imports
- ALWAYS wait for full test completion. Tests may appear to hang but will complete within 12 seconds.
- NOTE: Application may crash after serving initial requests due to database connection attempts - this is expected behavior without running MongoDB/MariaDB.

### Test Categories Available
- `npm run unitTests` -- Core unit tests (some require databases)
- `npm run existsTests` -- Route and class existence validation (database-independent)
- `npm run functionsTests` -- Function-level tests
- `npm run E2Etests` -- End-to-end API tests
- `npm run dbTests` -- Database-specific tests (require running databases)
- `npm run authTest` -- Authentication tests (require Auth0 configuration)

### Expected Test Behavior
- Tests requiring databases will timeout/fail without MongoDB/MariaDB running
- Auth tests fail without proper AUDIENCE and DOMAIN environment variables
- Core functionality tests (exists, basic units) should pass with minimal `.env` setup
- Database-independent tests complete in 6-15 seconds

## Common Tasks

### Repository Structure
```
/home/runner/work/TPEN-services/TPEN-services/
├── app.js                 # Express application setup
├── bin/tpen3_services.js  # Server entry point
├── package.json           # Dependencies and scripts
├── jest.config.js         # Test configuration
├── sample.env             # Environment template
├── API.md                 # API documentation
├── classes/               # Domain model classes
│   ├── Project/           # Project management
│   ├── User/              # User management
│   ├── Group/             # Group management
│   ├── Layer/             # Annotation layers
│   ├── Line/              # Text line handling
│   ├── Page/              # Page management
│   └── Manifest/          # IIIF manifest handling
├── database/              # Database drivers
│   ├── mongo/             # MongoDB controller
│   ├── maria/             # MariaDB controller
│   └── tiny/              # TinyPEN API controller
├── auth/                  # Auth0 authentication
├── project/               # Project API routes
├── manifest/              # Manifest API routes
├── userProfile/           # User API routes
├── line/                  # Line API routes
├── page/                  # Page API routes
└── utilities/             # Helper functions
```

### Key API Endpoints
- `GET /` -- Service status (returns "TPEN3 SERVICES BABY!!!")
- `GET /project/:id` -- Get project by ID (requires authentication)
- `POST /project/create` -- Create new project (requires authentication)
- `POST /project/import?createFrom=URL` -- Import project from IIIF manifest
- `GET /user/:id` -- Get user profile (public)
- `GET /my/profile` -- Get authenticated user profile
- `GET /manifest/:id` -- Get IIIF manifest
- `GET /line/:id` -- Get text line annotation
- `GET /page/:id` -- Get annotation page

### Authentication
- Uses Auth0 JWT bearer tokens
- Protected endpoints require `Authorization: Bearer <token>` header
- Environment variables AUDIENCE and DOMAIN must be configured for auth tests
- Public endpoints: `/`, `/user/:id`, `/manifest/:id`
- Protected endpoints: `/project/*`, `/my/*`, most POST/PUT/DELETE operations

### Database Configuration
- MongoDB: Configure MONGODB and MONGODBNAME in `.env`
- MariaDB: Configure MARIADB, MARIADBNAME, MARIADBUSER, MARIADBPASSWORD in `.env`
- TinyPEN API: Configure TINYPEN in `.env`
- Default configurations in `sample.env` point to development services

### Development Workflow
1. Always start with: `cp sample.env .env && npm install`
2. Make code changes
3. Test with: `npm run existsTests` (fast, database-independent)
4. For database changes: ensure MongoDB/MariaDB running, then `npm run dbTests`
5. For API changes: `npm run E2Etests`
6. Start dev server: `npm run dev`
7. Test manually: `curl http://localhost:3001/` and relevant endpoints

### Debugging and Troubleshooting
- Application logs appear in console when running `npm start` or `npm run dev`
- Database connection errors indicate missing database services
- Auth errors indicate missing AUDIENCE/DOMAIN environment variables
- 404 errors on routes indicate route registration issues
- Check `app.js` for middleware and route registration
- Jest warnings about experimental VM modules are expected (ES module usage)

### CI/CD Integration
- GitHub Actions workflows in `.github/workflows/`
- `test_pushes.yaml` runs unit tests on pushes
- `ci_dev.yaml` runs E2E tests on PRs to development
- Tests require environment secrets configured in GitHub repository settings

### Performance Notes
- Application startup: 2-3 seconds
- npm install: ~1-20 seconds depending on cache (timeout: 60+ seconds)
- Unit tests: ~12 seconds (timeout: 30+ seconds)
- Existence tests: ~7 seconds (timeout: 30+ seconds)
- Database tests: variable depending on database response times

### Critical Environment Variables
Required for basic functionality:
- `PORT` (default: 3001)
- `SERVERURL` (default: http://localhost:3001)

Required for database functionality:
- `MONGODB` (MongoDB connection string)
- `MONGODBNAME` (MongoDB database name)
- `MARIADB` (MariaDB host)
- `MARIADBNAME`, `MARIADBUSER`, `MARIADBPASSWORD` (MariaDB credentials)

Required for authentication:
- `AUDIENCE` (Auth0 audience)
- `DOMAIN` (Auth0 domain)

Required for external services:
- `TINYPEN` (TinyPEN API base URL)
- `RERUMURL` (RERUM repository URL)

### Manual Testing Scenarios
After making changes, always validate:
1. **Basic Service**: Start server with `npm start`, test with `curl http://localhost:3001/` - should return HTML containing "TPEN3 SERVICES BABY!!!" in the response body
2. **Route Registration**: `npm run existsTests` passes without errors
3. **Core Logic**: `npm run unitTests` passes tests that don't require databases (some MongoDB tests will timeout - this is expected)
4. **API Authentication**: Protected endpoints like `/my/profile` return 401 status code without valid tokens
5. **Application Behavior**: Server may crash after serving requests when MongoDB is not available - this is expected and indicates database connection attempts are working correctly

### Complete Validation Workflow Example
```bash
# Basic setup
cp sample.env .env
npm install

# Test core functionality without databases
npm run existsTests  # Should pass completely
npm run unitTests   # Should pass most tests, MongoDB tests will timeout

# Test application serving
npm start &
sleep 3
curl http://localhost:3001/  # Should return HTML with service name
curl -w "Status: %{http_code}\n" http://localhost:3001/my/profile  # Should return 401
kill %1  # Stop the background server
```

### Common File Locations
- Main application entry: `bin/tpen3_services.js`
- Express app setup: `app.js`
- Route definitions: `project/index.js`, `userProfile/index.js`, etc.
- Database controllers: `database/mongo/controller.js`, `database/maria/controller.js`
- Authentication middleware: `auth/index.js`
- Domain models: `classes/[Entity]/[Entity].js`
- Configuration: `sample.env` (template), `.env` (local config)

### Dependencies and Versions
- Express.js for REST API framework
- MongoDB driver for document storage
- MariaDB driver for relational storage
- Auth0 libraries for JWT authentication
- Jest for testing framework
- Nodemon for development auto-reload
- IIIF libraries for manifest handling

NEVER CANCEL long-running commands. Application builds and tests are designed to complete within documented timeouts. Always wait for completion to ensure accurate validation of changes.

All work on issues for bugs, features, and enhancements will target the `development` branch. The `main` branch will only be targetted with hotfixes by admins or by PRs from the `development` branch. New work should branch from `development`.
