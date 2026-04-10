module.exports = {
  apps: [
    {
      name: 'nestjs-dev',
      script: 'npm',
      args: 'run start:dev',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'development',
      },
    },
    {
      name: 'ngrok-tunnel',
      script: 'ngrok',
      args: 'http 3000',
      autorestart: true,
    },
  ],
};
