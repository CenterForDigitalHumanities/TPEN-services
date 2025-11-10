# Contributing to TPEN Services

Thank you for your interest in contributing to TPEN Services! This guide will help you get started with the development environment and contribution process.

## Prerequisites

### Node.js and npm
- **Node.js version**: >= 22.20.0 (as specified in `package.json`)
- **npm**: Latest version (comes with Node.js)

You can download Node.js from [nodejs.org](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

To check your current versions:
```bash
node --version
npm --version
```

### Database Requirements
TPEN Services uses **MongoDB** for primary data storage.

For local development, you'll need either:
- Local installation of MongoDB
- Docker container running MongoDB
- Access to a remote MongoDB instance (such as MongoDB Atlas)

### Git
- Git should be installed and configured on your system
- Familiarity with Git workflows (branching, merging, pull requests)

## Getting Started

### 1. Fork and Clone the Repository

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/TPEN-services.git
cd TPEN-services
```

3. Add the upstream repository as a remote:
```bash
git remote add upstream https://github.com/CenterForDigitalHumanities/TPEN-services.git
```

### 2. Install Dependencies

Install all project dependencies:
```bash
npm install
```

**Note**: If you encounter engine compatibility warnings due to Node.js version requirements, consider upgrading Node.js or using a compatible version manager.

### 3. Environment Configuration

TPEN Services uses a layered configuration approach:

1. **Copy the development template:**

   ```bash
   cp .env.development .env
   ```

2. **Edit `.env` to configure your local environment.** Key settings to update:
   - **GITHUB_TOKEN**: Your GitHub Personal Access Token (required)
   - **AUDIENCE**: Auth0 audience for JWT validation
   - **DOMAIN**: Auth0 domain
   - **MONGODB**: MongoDB connection string (if different from localhost)
   - **PORT**: Server port (default: 3011)

3. **Configuration files explained:**
   - `config.env` - Safe defaults (committed, no secrets)
   - `.env.development` - Development template (committed)
   - `.env.production` - Production template (committed)
   - `.env` - Your local config (gitignored, created by you)

The application loads `config.env` first for defaults, then `.env` for your overrides.

**Important**: Never commit your `.env` file to version control. It's included in `.gitignore` for security.

See [CONFIG.md](./CONFIG.md) for complete configuration documentation.

### 4. Database Setup

#### MongoDB

- Install MongoDB locally or use MongoDB Atlas (cloud)
- The default configuration (`config.env`) uses `mongodb://localhost:27017`
- Update `MONGODB` in your `.env` file if using a different connection
- Ensure the database specified in `MONGODBNAME` exists (default: `testTpen`)

**Note**: The project uses MongoDB as its primary database. While the codebase includes a MariaDB controller, it is not actively used and MongoDB is sufficient for development.

### 5. Authentication Setup

TPEN Services uses Auth0 for authentication. For development:
- Set up an Auth0 account and application
- Configure your `.env` file with the appropriate `AUDIENCE` and `DOMAIN` values
- Some features may require valid Auth0 configuration to function properly

> Auth0 is not required for development, but will always be used upstream. If you have an alternate solution, you only need to replace the `/auth` directory to ensure your own middleware is utilized. Contributions to the main project that alter these files will not be accepted.

## Running the Project Locally

### Development Server
Start the development server with hot reloading:
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default:3011).

### Production Mode
Run the server in production mode:
```bash
npm start
```

### Checking the Server
Once running, you can test the server:
```bash
curl http://localhost:3011
```

## Testing

TPEN Services uses Jest for testing with multiple test suites:

### Run All Tests
```bash
npm run allTests
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run unitTests

# End-to-end tests
npm run E2Etests

# Database tests
npm run dbTests

# Authentication tests
npm run authTest

# User class tests
npm run userClassTests

# Import functionality tests
npm run importTests

# Member invitation tests
npm run inviteMemberTests
```

### Test Requirements
- Some tests require database connections and will be skipped if databases are not available
- Authentication tests require proper Auth0 configuration ( currently skipped )
- Ensure your `.env` file is properly configured before running tests

## Code Style and Best Practices

### General Guidelines
- Use ES6+ modules (`import`/`export` syntax)
- Follow existing code style and patterns
    - Prefer switch statements, ternary operations, and guard clauses in place of complex if-else blocks
    - Use terminal semicolons only when required by syntax as the leadign character of the problematic line
    - Use nullish coalescing operators and optional chaining for clarity in place of expanded conditionals
    - Use clear and English(ish) symbol names
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation when making changes

### File Organization
- **API Routes**: Organized in feature folders (`project/`, `manifest/`, `line/`, etc.)
- **Classes**: Located in `classes/` directory
- **Utilities**: Helper functions in `utilities/` directory
- **Tests**: Use `__tests__` directories or `.test.js` suffix

### Error Handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Follow the existing error handling patterns

## Making Contributions

### 1. Create a Branch
```bash
git checkout -b issue-#-your-feature/fix-name
```

### 2. Make Your Changes
- Write your code following the project's patterns
- Add or update tests as needed
- Ensure all tests pass
- Update documentation if necessary

### 3. Test Your Changes
```bash
# Run relevant test suites
npm run unitTests
npm run E2Etests

# Test the server manually
npm run dev
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new feature description"
```

Use conventional commit messages:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/updates
- `refactor:` for code refactoring

### 5. Push and Create Pull Request
```bash
git push origin issue-#-your-feature/fix-name
```

Then create a pull request on GitHub with:
- Clear description of changes
- Reference to any related issues
- Screenshots or examples if applicable

## Project Structure

```
TPEN-services/
├── auth/              # Authentication middleware
├── bin/               # Server startup scripts
├── classes/           # Core business logic classes
├── database/          # Database controllers and utilities
├── project/           # Project management routes
├── manifest/          # IIIF manifest routes
├── line/              # Line/annotation routes
├── userProfile/       # User profile routes
├── utilities/         # Helper functions
├── __tests__/         # Global tests
├── app.js             # Express app configuration
├── package.json       # Dependencies and scripts
├── config.env         # Safe defaults (committed)
├── .env.development   # Development template
├── .env.production    # Production template
└── README.md          # Basic project information
```

## API Documentation

- Main API documentation is available in individual feature folders
- Example: `project/documentation.md` contains project API endpoints
- Follow existing documentation patterns when adding new endpoints

## Getting Help

- **Issues**: Check existing [GitHub issues](https://github.com/CenterForDigitalHumanities/TPEN-services/issues) or create a new one
- **Discussions**: Use GitHub discussions for questions and feature ideas
- **Documentation**: Refer to existing code and documentation for patterns

## Additional Resources

- [TPEN Project Homepage](https://t-pen.org/TPEN3)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Jest Testing Framework](https://jestjs.io/)
- [Auth0 Documentation](https://auth0.com/docs)

## License

By contributing to TPEN Services, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to TPEN Services! Your contributions help make digital humanities tools more accessible and powerful.
