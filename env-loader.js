/**
 * Environment Variable Loader
 *
 * Preloads environment variables before application starts.
 * Uses --import flag to guarantee execution before any other imports.
 *
 * Loading order:
 * 1. config.env (base defaults)
 * 2. .env.{NODE_ENV} (environment-specific)
 * 3. .env.{NODE_ENV}.local (environment-specific local overrides)
 * 4. .env.local (local overrides)
 * 5. .env (local overrides)
 */

import dotenv from 'dotenv'
import dotenvFlow from 'dotenv-flow'

// Load config.env first (base defaults)
dotenv.config({ path: './config.env' })

// Then load environment-specific files
dotenvFlow.config({
  default_node_env: 'development',
  silent: false
})

console.log(`✓ Environment loaded: ${process.env.NODE_ENV || 'development'}`)
