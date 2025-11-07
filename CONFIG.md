# TPEN Services Configuration Guide

## Configuration Architecture

TPEN Services uses a layered configuration approach to separate safe defaults from environment-specific secrets. Configuration is loaded using Node.js's native `--env-file` flag (Node.js 22+):

1. **`config.env`** (committed) - Safe defaults for development
2. **`.env`** (gitignored) - Environment-specific overrides

### Configuration Files

- **`config.env`** - Default configuration
  - Contains safe defaults that work for local development
  - Can be committed to the repository (no secrets)
  - Provides sensible defaults for MongoDB, MariaDB, and external services
  - Loaded first by the application

- **`.env.development`** - Development template
  - Template for development environments
  - Copy to `.env` for local development
  - Contains placeholders for secrets (GITHUB_TOKEN, Auth0, etc.)
  - Can be committed as documentation
  
- **`.env.production`** - Production template
  - Template for production deployments
  - Shows required production configuration
  - All secrets marked with `REPLACE_WITH_SECRET`
  - Should never contain actual production secrets

- **`.env`** - Local/deployment configuration
  - Your actual configuration (gitignored)
  - Created by copying a template
  - Contains real secrets and environment-specific values
  - Overrides values from `config.env`

### Quick Start

```bash
# For local development
cp .env.development .env

# For production deployment
cp .env.production .env

# Edit .env with your specific values
# Required: GITHUB_TOKEN, AUDIENCE, DOMAIN
# Optional: Database connections, SMTP, etc.
```

The application loads configuration via Node.js's native `--env-file` flag in this order:

1. `config.env` - provides defaults
2. `.env` - overrides with environment-specific values

### What Goes Where?

**`config.env` (committed, safe defaults):**

- Server ports and basic settings
- MongoDB/MariaDB localhost defaults
- Development service endpoints (devstore.rerum.io, etc.)
- Collection names
- Non-sensitive configuration

**`.env` (gitignored, secrets):**

- GitHub Personal Access Tokens
- Auth0 credentials
- Production database connection strings
- SMTP credentials
- Production service URLs
- API keys

## Environment Variables Reference

### Server Configuration

- `PORT` - Server port (default: 3011)
- `SERVERURL` - Public URL for this service
  - Dev: `https://dev.api.t-pen.org`
  - Prod: `https://api.t-pen.org`
- `DOWN` - Maintenance mode flag (true/false)

### Database Configuration

**MongoDB:**

- `MONGODB` - Connection string (e.g., `mongodb://localhost:27017`)
- `MONGODBNAME` - Database name
  - Dev: `testTpen`
  - Prod: `tpen`
- `TPENPROJECTS`, `TPENGROUPS`, `TPENUSERS` - Collection names

**MariaDB:** (not actively used)

- `MARIADB` - Host address
- `MARIADBNAME` - Database name
- `MARIADBUSER` - Username
- `MARIADBPASSWORD` - Password

### External Services

**RERUM Store:**

- `RERUMIDPREFIX` - RERUM ID prefix
  - Dev: `https://devstore.rerum.io/v1/id/`
  - Prod: `https://store.rerum.io/v1/id/`

**TinyPEN:**

- `TINYPEN` - TinyPEN API base URL
  - Dev: `https://dev.tiny.t-pen.org/`
  - Prod: `https://tiny.t-pen.org/`

**Static Storage (GitHub):**

- `REPO_OWNER` - GitHub organization (e.g., `CenterForDigitalHumanities`)
- `REPO_NAME` - Repository name
  - Dev: `TPEN-Static-Dev`
  - Prod: `TPEN-static`
- `GITHUB_TOKEN` - Personal access token with repo write access
- `BRANCH` - Target branch (usually `main`)
- `TPENSTATIC` - Public URL for static files

### Authentication (Auth0)

- `AUDIENCE` - Auth0 API audience (should match SERVERURL)
- `DOMAIN` - Auth0 tenant domain

### CORS Configuration

TPEN Services uses an open CORS policy by default. The API is accessible from any origin without restrictions. This is intentional to support public access to the API.

No CORS-related environment variables are needed.

### Email Configuration

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `TPEN_SUPPORT_EMAIL` - Support email address
- `TPEN_EMAIL_CC` - CC email address for notifications

## Development vs Production

Key differences between environments:

| Variable | Development | Production |
|----------|-------------|------------|
| SERVERURL | <https://dev.api.t-pen.org> | <https://api.t-pen.org> |
| MONGODBNAME | testTpen | tpen |
| RERUMIDPREFIX | <https://devstore.rerum.io/v1/id/> | <https://store.rerum.io/v1/id/> |
| REPO_NAME | TPEN-Static-Dev | TPEN-static |

## GitHub Secrets Configuration

For CI/CD deployments, set these secrets in GitHub repository settings:

**Development Environment:**

- All variables from `.env.development`
- Especially: `MONGODB`, `MONGODBNAME`, `GITHUB_TOKEN`, `AUDIENCE`, `DOMAIN`

**Production Environment:**

- All variables from `.env.production`
- Especially: `MONGODB`, `MONGODBNAME`, `GITHUB_TOKEN`, `AUDIENCE`, `DOMAIN`
- Use separate Auth0 tenant for production
- Use production database credentials

## API Access Policy

TPEN Services provides a public API with an open CORS policy. The API is accessible from any origin without restrictions. This design decision supports:

- Public access to cultural heritage data
- Integration from any web application or service
- Educational and research use cases
- Community-driven digital humanities projects

No CORS configuration is required - all origins are permitted by default.

### Validation

After configuration, verify:

```bash
# Start the service
npm start

# Test the root endpoint
curl http://localhost:3011/
# Should return HTML with "TPEN3 SERVICES BABY!!!"

# Test from any origin - CORS is open by default
curl -H "Origin: https://app.t-pen.org" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3011/project
# Should return CORS headers allowing all origins

# Test authentication requirement
curl http://localhost:3011/my/profile
# Should return 401 Unauthorized
```

### Migration Notes

The following changes enable environment-based configuration:

1. **Open CORS policy** - API accessible from any origin without restrictions
2. **Native env loading** - Uses Node.js 22+ `--env-file` flag, no dotenv packages needed
3. **Layered configuration** - `config.env` provides defaults, `.env` overrides
4. **Static repo configurable** - `REPO_NAME` switches between TPEN-Static-Dev and TPEN-static
5. **Database names environment-specific** - `testTpen` (dev) vs `tpen` (prod)

All deployments must set appropriate environment variables via `.env` file or CI/CD secrets.

### Troubleshooting

**API access from browser:**

- CORS is open - all origins are allowed by default
- No CORS configuration needed
- The API is designed for public access

**Database connection failures:**

- Verify `MONGODB` connection string
- Confirm `MONGODBNAME` exists
- Check network access to database host

**Auth0 errors:**

- Verify `AUDIENCE` matches the API URL
- Confirm `DOMAIN` is correct Auth0 tenant
- Check token includes required scopes
