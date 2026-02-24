# copilot-instructions.md

This file provides guidance to GitHub Copilot and other AI Assistants when working with code in this repository.

## TPEN Services

## Project Overview

TPEN Services is a Node.js Express API service for TPEN3 (Transcription for Paleographical and Editorial Notation). This provides RESTful APIs for digital humanities, cultural heritage, annotation services, and IIIF manifest handling. The service supports multiple database backends (MongoDB, MariaDB) and uses Auth0 for authentication.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Environment configuration is in .env.  Copy environment configuration: `cp .env.development .env`
- Install dependencies: `npm install` -- takes up to 20 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Environment Requirements
- Node.js >= 22.20.0 
- MongoDB (for database tests and full functionality)
- For full functionality, configure database connection strings, GITHUB_TOKEN, and Auth0 credentials in `.env`

### Environment Configuration

TPEN Services uses a layered configuration approach with `--import ./env-loader.js` using the dotenv package:

- `config.env` - Safe defaults (committed to repo, no secrets)
  - Works out-of-the-box for local Docker/MongoDB/MariaDB
  - Contains localhost database defaults
  - Points to development external services
- `.env.development` - Development template (committed, example secrets)
  - Copy this to `.env` for local development
  - Contains placeholders for secrets
- `.env.production` - Production template (committed, example configuration)
  - Copy this to `.env` for production deployments
  - All secrets marked with REPLACE_WITH_SECRET
- `.env` - Your local configuration (gitignored)
  - Created by copying a template
  - Contains actual secrets and environment-specific values
  - Overrides values from `config.env`

Configuration loading order (via `--import ./env-loader.js` using the dotenv package):

1. `config.env` is loaded first (provides safe defaults)
2. `.env.{NODE_ENV}` is loaded second (environment-specific: .env.development, .env.production, .env.test)
3. `.env` is loaded last (local/server overrides - HIGHEST PRIORITY)

This allows developers to work immediately with sensible defaults while keeping secrets out of the repository.

## Validation

### Always Validate Core Functionality After Changes

- Start the application: `npm start` or `npm run dev`
- Test the root endpoint: `curl http://localhost:3011/` -- should return HTML containing the TPEN3 Services index (heading + welcome text)
- Run unit tests that don't require databases: `npm run unitTests` -- many tests pass without database connections
- Run existence tests: `npm run existsTests` -- validates route registration and class imports
- Run all tests: `npm run allTests` -- Full test suite confirming full app functionality
- ALWAYS wait for full test completion. Tests may appear to hang but should complete within 2 minutes. 
- NOTE: Application may crash after serving initial requests due to database connection attempts - this is expected behavior without running MongoDB/MariaDB.

### Test Categories Available
- `npm run allTests` -- Full test suite which requires .env settings
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

### Database Configuration

> See config.env

Required for basic functionality:

- `PORT` (default: 3011)
- `SERVERURL` (default: http://localhost:3011)

Required for database functionality:

- `MONGODB` (MongoDB connection string)
- `MONGODBNAME` (MongoDB database name)
- `MARIADB` (MariaDB host)
- `MARIADBNAME`, `MARIADBUSER`, `MARIADBPASSWORD` (MariaDB credentials)

MongoDB collection names (configured in `config.env`):

- `TPENPROJECTS` (default: projects) - Project documents collection
- `TPENGROUPS` (default: groups) - User groups collection
- `TPENUSERS` (default: users) - User profiles collection
- `TPENCOLUMNS` (default: columns) - Column annotations collection

Required for authentication:

- `AUDIENCE` (Auth0 audience)
- `DOMAIN` (Auth0 domain)

Required for external services:

- `TINYPEN` (TinyPEN API base URL)
- `RERUMIDPREFIX` (RERUM ID prefix URL)

### Development Workflow

1. Do not overwrite the existing .env file.  If an .env file does not exist or is not populated then copy environment configuration: `cp .env.development .env`
2. Install dependencies with `npm install`
3. Make code changes
4. Test with: `npm run existsTests` (fast, database-independent)
5. For all other tests use `npm run allTests`
8. Test manually: `curl http://localhost:3011/` and relevant endpoints

NEVER CANCEL long-running commands. Application builds and tests are designed to complete within documented timeouts. Always wait for completion to ensure accurate validation of changes.

All work on issues for bugs, features, and enhancements will target the `development` branch. The `main` branch will only be targetted with hotfixes by admins or by PRs from the `development` branch. New work should branch from `development`.
