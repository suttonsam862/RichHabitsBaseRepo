// Simple startup script to ensure compatibility across environments
process.env.NODE_ENV = 'production';
import('./dist/index.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});