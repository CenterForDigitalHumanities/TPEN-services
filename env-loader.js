/**
 * Environment Variable Loader
 *
 * Preloads environment variables before application starts.
 * Uses --import flag to guarantee execution before any other imports.
 *
 * ENVIRONMENT VARIABLE LOADING PRIORITY (lowest to highest):
 * 1. config.env              - Safe defaults for all environments (committed)
 * 2. .env.{NODE_ENV}         - Environment-specific (.env.development, .env.production) (committed)
 * 3. .env                    - Local/server secrets and overrides (gitignored) ← HIGHEST PRIORITY
 *
 * Each level overrides values from levels above it.
 *
 * FOR LOCAL DEVELOPMENT:
 * - Create a .env file with your local database connections, API keys, etc.
 * - .env is gitignored and will override ALL other environment files
 * - Never commit .env - it contains your personal/local settings
 *
 * FOR SERVERS (Production/Development):
 * - Server .env files contain production/staging database URLs and secrets
 * - .env overrides committed .env.production or .env.development values
 * - No need to rename existing .env files on servers
 *
 * FOR TESTING:
 * - Tests run with NODE_ENV='test' by default
 * - Your local .env overrides will apply to tests
 * - Ensures tests use your local database connections
 *
 * COMMITTED FILES (in git):
 * - config.env          ✓ Safe defaults for all environments
 * - .env.development    ✓ Development environment settings
 * - .env.production     ✓ Production environment settings
 *
 * GITIGNORED FILES (local/server only):
 * - .env                ✗ Your personal/server secrets (HIGHEST PRIORITY)
 *
 * VIEWING OUTPUT LOGS:
 * When running under PM2, env-loader.js output appears in PM2's system logs
 * (~/.pm2/pm2.log), NOT in application logs (./logs/pm2-out.log), because
 * this module executes BEFORE the application starts.
 *
 * To view env-loader output:
 * - PM2 system logs: pm2 logs --lines 50 --nostream
 * - Application logs: tail -f ./logs/pm2-out.log
 */

import dotenv from 'dotenv'
import { existsSync } from 'fs'

const env = process.env.NODE_ENV || 'development'

// Load in priority order (later files override earlier ones)
const files = [
  './config.env',        // 1. Base defaults (lowest priority)
  `./.env.${env}`,       // 2. Environment-specific (.env.development, .env.production, .env.test)
  './.env'               // 3. Local/server overrides (HIGHEST PRIORITY)
]
console.log("loop files")
console.log("files")
files.forEach(file => {
  if (existsSync(file)) {
    console.log("Applying env")
    console.log(file)
    dotenv.config({ path: file, override: true })
  }
})

console.log(`✓ Environment loaded: ${env}`)
