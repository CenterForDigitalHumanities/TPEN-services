# CLAUDE.md

This file provides guidance to AI Assistants when working with code in this repository.  There is also a .github/copilot-instructions.md file.

## Project Overview

TPEN Services is a Node.js Express API service for TPEN3 (Transcription for Paleographical and Editorial Notation). This provides RESTful APIs for digital humanities, cultural heritage, annotation services, and IIIF manifest handling. The service supports multiple database backends (MongoDB, MariaDB) and uses Auth0 for authentication.

## Working Effectively

### Bootstrap, Build, and Test the Repository
- Environment configuration is in .env.  Do not overwrite the existing .env file.  If an .env file does not exist then copy environment configuration: `cp .env.development .env`
- Install dependencies: `npm install` -- takes up to 20 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Run the Application
- ALWAYS run the bootstrapping steps first.
- Production server: `npm start` -- starts on port 3011
- Development server: `npm run dev` -- starts with nodemon auto-reload on port 3011
- Test basic functionality: `curl http://localhost:3011/API.html` should return the API page.

## Validation

### Always Validate Core Functionality After Changes
- Run `npm run allTests` once you have completed your task and need to verify correctness before continuing.
- ALWAYS wait for full test completion. Tests can take minutes. NEVER CANCEL.
- NOTE: Application may crash after serving initial requests due to database connection attempts - this is expected behavior without a connection to MongoDB.

### Expected Test Behavior
- Tests requiring databases will timeout/fail without MongoDB/MariaDB running
- Auth tests fail without proper AUDIENCE and DOMAIN environment variables
- Core functionality tests (exists, basic units) should pass with minimal `.env` setup

### Development Workflow
1. Ensure .env exists (if not: `cp .env.development .env`) and run `npm install`
2. Make code changes
3. Once the task is complete and verification is needed: `npm run allTests`
4. Start app if manual testing is needed.

### External Resources
- [IIIF Presentation API](https://iiif.io/api/presentation/)
- [W3C Web Annotation](https://www.w3.org/TR/annotation-model/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TPEN3 Project Homepage](https://three.t-pen.org)
- [TPEN3 Services API](https://dev.api.t-pen.org)
- [TPEN3 Services GitHub](https://github.com/CenterForDigitalHumanities/TPEN-services)
- [TPEN3 Interfaces GitHub](https://github.com/CenterForDigitalHumanities/TPEN-interfaces)
- [RERUM API Docs](https://store.rerum.io/v1/API.html)
- [RERUM API GitHub](https://github.com/CenterForDigitalHumanities/rerum_server_nodejs/)
- [TPEN3 Homepage](https://three.t-pen.org)

## Additional Developer Preferences for AI Assistants

1. Do not automatically commit or push code.  Developers prefer to do this themselves when the time is right.
  - Make the code changes as requested.
  - Explain what changed and why.
  - Stop before committing.  The developer will decide at what point to commit changes on their own.  You do not need to keep track of it.
2. No auto compacting.  We will compact ourselves if the context gets too big.
3. When creating documentation do not add any AI as an @author.
4. Preference using current libraries and native javascript/ExpressJS/Node capabilities instead of installing new npm packages to solve a problem.
  - However, we understand that sometimes we need a package or a package is perfectly designed to solve our problem.  Ask if we want to use them in these cases.
5. We like colors in our terminals!  Be diverse and color text in the terminal for the different purposes of the text.  (ex. errors red, success green, logs bold white, etc.)
6. We like to see logs from running code, so expose those logs in the terminal logs as much as possible.
7. Use JDoc style for code documentation.  Cleanup, fix, or generate documentation for the code you work on as you encounter it. 
8. We use `npm start` often to run the app locally.  However, do not make code edits based on this assumption.  Production and development load balance in the app with pm2, not by using `npm start`
9. NEVER CANCEL long-running commands. Application builds and tests are designed to complete within documented timeouts. Always wait for completion to ensure accurate validation of changes.
10. All work on issues for bugs, features, and enhancements will target the `development` branch. The `main` branch will only be targetted with hotfixes by admins or by PRs from the `development` branch. New work should branch from `development`.
