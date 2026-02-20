module.exports = {
  apps: [
    {
      name: 'buffs-api',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork', // 'cluster' com instances:1 tem overhead extra; fork é mais leve
      autorestart: true,
      watch: false,
      max_memory_restart: '300M', // reinicia se ultrapassar 300 MB (era 1G, inútil em t3.micro)
      node_args: '--max-old-space-size=256', // limita heap do V8 a 256 MB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};