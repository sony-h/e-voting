module.exports = {
  apps: [
    {
      name: 'evoting-backend',
      cwd: '/opt/e-voting/apps/api',
      script: 'dist/main.js',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_PATH: '/opt/e-voting/node_modules/.pnpm/node_modules',
        PORT: 3100,
      },
      max_memory_restart: '300M',
      autorestart: true,
    },
    {
      name: 'evoting-frontend',
      cwd: '/opt/e-voting/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3101',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3101,
      },
      max_memory_restart: '400M',
      autorestart: true,
    },
  ],
};
