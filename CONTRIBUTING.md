# Contributing to TPEN Services

Thank you for your interest in contributing to TPEN Services! This guide will help you get started with the development environment and contribution process.

## Prerequisites

### Node.js and npm
- **Node.js version**: >= 22.14.0 (as specified in `package.json`)
- **npm**: Latest version (comes with Node.js)

You can download Node.js from [nodejs.org](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

To check your current versions:
```bash
node --version
npm --version
```

### Database Requirements
TPEN Services uses two database systems:
- **MongoDB**: For primary data storage
- **MariaDB**: For additional data operations

For local development, you'll need either:
- Local installations of MongoDB and MariaDB
- Docker containers running these databases
- Access to remote database instances

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

1. Copy the sample environment file:
```bash
cp sample.env .env
```

2. Edit `.env` to configure your local environment. Key settings include:
   - **PORT**: Server port (default: 3001)
   - **MONGODB**: MongoDB connection string
   - **MONGODBNAME**: MongoDB database name
   - **MARIADB**: MariaDB host
   - **MARIADBNAME**: MariaDB database name
   - **MARIADBUSER**: MariaDB username
   - **MARIADBPASSWORD**: MariaDB password
   - **AUDIENCE**: Auth0 audience for JWT validation
   - **DOMAIN**: Auth0 domain

**Important**: Never commit your `.env` file to version control. It's included in `.gitignore` for security.

### 4. Database Setup

#### MongoDB
- Install MongoDB locally or use MongoDB Atlas
- Update the `MONGODB` connection string in your `.env` file
- Ensure the database specified in `MONGODBNAME` exists

#### MariaDB
- Install MariaDB locally or use a cloud service
- Create a database and user as specified in your `.env` file
- Update the MariaDB connection settings accordingly

### 5. Authentication Setup

TPEN Services uses Auth0 for authentication. For development:
- Set up an Auth0 account and application
- Configure your `.env` file with the appropriate `AUDIENCE` and `DOMAIN` values
- Some features may require valid Auth0 configuration to function properly

## Running the Project Locally

### Development Server
Start the development server with hot reloading:
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3001).

### Production Mode
Run the server in production mode:
```bash
npm start
```

### Checking the Server
Once running, you can test the server:
```bash
curl http://localhost:3001
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
- Authentication tests require proper Auth0 configuration
- Ensure your `.env` file is properly configured before running tests

## Code Style and Best Practices

### General Guidelines
- Use ES6+ modules (`import`/`export` syntax)
- Follow existing code style and patterns
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation when making changes

### File Organization
- **Routes**: Organized in feature folders (`project/`, `manifest/`, `line/`, etc.)
- **Classes**: Located in `classes/` directory
- **Utilities**: Helper functions in `utilities/` directory
- **Tests**: Use `__tests__` directories or `.test.js` suffix

### Error Handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Follow the existing error handling patterns

## Making Contributions

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
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
git push origin feature/your-feature-name
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
├── sample.env         # Environment variables template
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