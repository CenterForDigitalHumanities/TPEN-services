/**
 * PM2 Ecosystem Configuration for TPEN Services
 *
 * This configuration ensures that Node.js 22's --env-file flag is properly
 * passed when running in PM2 cluster mode, allowing config.env and .env
 * to be loaded correctly.
 *
 * Usage:
 *   pm2 start ecosystem.config.js --env development
 *   pm2 start ecosystem.config.js --env production
 */

export default {
  apps: [
    {
      name: 'tpen3-services',
      script: './bin/tpen3_services.js',
      instances: 'max',
      exec_mode: 'cluster',
      node_args: '--env-file=config.env --env-file=.env',
      env_development: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      // PM2 cluster mode settings
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: false,
      max_memory_restart: '500M',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Auto-restart settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
