// Custom deployment script to handle environment differences
import fs from 'fs';
import { spawn } from 'child_process';

// Set production environment for Node.js
process.env.NODE_ENV = 'production';

// Check if the built application exists
if (!fs.existsSync('./dist/index.js')) {
  console.error('Error: Build files not found. Run `npm run build` first.');
  process.exit(1);
}

console.log('Starting production server...');

// Start the server
const server = spawn('node', ['dist/index.js'], { 
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// Handle server process events
server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

server.on('error', (err) => {
  console.error('Failed to start server process:', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Graceful shutdown...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Graceful shutdown...');
  server.kill('SIGTERM');
});