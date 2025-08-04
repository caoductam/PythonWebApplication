const { spawn } = require('child_process');

const servers = [
  { name: 'user', path: './user/backend.js' },
  { name: 'tag', path: './tag/backend.js'},
];

servers.forEach(server => {
  const child = spawn('node', [server.path], { stdio: 'inherit' });
  console.log(`${server.name} server started with PID: ${child.pid}`);
});