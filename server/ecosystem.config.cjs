/**
 * PM2 process configuration.
 * Run from this directory: pm2 startOrReload ecosystem.config.cjs
 *
 * NOTE: scaling beyond a single instance requires a Redis presence/driver
 * and one port per instance. See: https://docs.colyseus.io/scalability
 */

module.exports = {
  apps : [{
    name: "colyseus-app",
    script: 'build/index.js',
    cwd: __dirname,
    time: true,
    watch: false,
    instances: 1,
    exec_mode: 'fork',
    wait_ready: true,
    env: {
      NODE_ENV: "production",
    },
  }],
};
