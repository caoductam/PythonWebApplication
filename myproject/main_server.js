const { spawn } = require('child_process');

const servers = [
  { name: 'user', path: './user/backend.js' },
  { name: 'tag', path: './tag/backend.js'},
  { name: 'category', path: './category/backend.js'},
  { name: 'document', path: './document/backend.js'},
  { name: 'frontend', path: './frontend/backend.js'}
];

servers.forEach(server => {
  const child = spawn('node', [server.path], { stdio: 'inherit' });
  console.log(`${server.name} server started with PID: ${child.pid}`);
});