# TPEN Services

Services required by TPEN interfaces in order to interact with data.

**Open API**: TPEN Services provides a public API with an open CORS policy, accessible from any origin without restrictions.

## Quick Start

### Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   # Copy the development template
   cp .env.development .env
   
   # Edit .env with your specific values:
   # - Add your GitHub token (GITHUB_TOKEN)
   # - Set your Auth0 credentials (AUDIENCE, DOMAIN)
   # - Adjust other settings as needed
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```
   
   The service will be available at `http://localhost:3011`

### Configuration Files

TPEN Services uses a layered configuration approach with `--import ./env-loader.js` using the dotenv package:

- **`config.env`** - Safe defaults, committed to repository
  - Works out-of-the-box for local Docker/MongoDB/MariaDB
  - Contains no secrets
  - Provides sensible defaults for development

- **`.env.development`** - Development environment template
  - Copy this to `.env` for local development
  - Contains placeholders for secrets
  - Can be committed (no actual secrets)

- **`.env.production`** - Production environment template
  - Template for production deployments
  - All secrets should be replaced with actual values
  - Never commit actual production secrets

- **`.env`** - Your local configuration (gitignored)
  - Created by copying a template
  - Contains your specific settings and secrets
  - Overrides values from `config.env`

Configuration is loaded via `--import ./env-loader.js` using the dotenv package:

1. `config.env` is loaded first (provides safe defaults)
2. `.env.{NODE_ENV}` is loaded second (environment-specific: .env.development, .env.production, .env.test)
3. `.env` is loaded last (local/server overrides - HIGHEST PRIORITY)

### Environment Variables

Key variables you'll need to set in `.env`:

- `GITHUB_TOKEN` - GitHub Personal Access Token for static storage
- `AUDIENCE` - Auth0 API audience
- `DOMAIN` - Auth0 tenant domain
- `MONGODB` - MongoDB connection string (if different from default)
- `MARIADB` - MariaDB host (if different from default)

See [CONFIG.md](./CONFIG.md) for complete configuration documentation.

## Testing

```bash
# Run all tests
npm run allTests

# Run specific test suites
npm run unitTests      # Core unit tests
npm run existsTests    # Route/class validation
npm run E2Etests       # End-to-end API tests
npm run dbTests        # Database tests
```

## Deployment

For production deployments:

1. Copy `.env.production` to `.env`
2. Replace all `REPLACE_WITH_SECRET` placeholders with actual secrets
3. Use GitHub Secrets or environment variables for sensitive values
4. Never commit production secrets to the repository

See [CONFIG.md](./CONFIG.md) for detailed deployment instructions.
 