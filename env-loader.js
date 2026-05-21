/**
 * Environment Variable Loader
 *
 * Bootstraps environment variables before the application starts.
 * Imported at the top of bin/tpen3_services.js so PM2 (which invokes
 * `node ./bin/tpen3_services.js` directly, bypassing the npm scripts'
 * --env-file flags) still loads the same layered config.
 *
 * LOADING PRIORITY (highest to lowest):
 *   1. .env                - Local/server overrides (gitignored)
 *   2. .env.{NODE_ENV}     - Environment-specific (.env.development, .env.production)
 *   3. config.env          - Safe defaults (committed)
 *
 * Files are loaded in priority order (highest first) because Node's
 * native `process.loadEnvFile()` does NOT override values already present
 * in process.env — so the first file to define a key wins.
 *
 * This intentionally mirrors the priority of the npm scripts'
 * `--env-file=config.env --env-file-if-exists=.env.development --env-file-if-exists=.env`
 * chain, where `--env-file` CLI flags DO override and the last file wins.
 * Both code paths converge on the same end-state precedence.
 */

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = process.env.NODE_ENV || 'development'

const files = [
  join(__dirname, '.env'),
  join(__dirname, `.env.${env}`),
  join(__dirname, 'config.env')
]

for (const file of files) {
  if (existsSync(file)) {
    process.loadEnvFile(file)
    console.log(`\x1b[32m✓\x1b[0m Loaded environment file: ${file}`)
  } else {
    console.log(`\x1b[33m✗\x1b[0m Missing environment file: ${file}`)
  }
}

console.log(`\x1b[1m✓ Environment loaded:\x1b[0m ${env}`)
