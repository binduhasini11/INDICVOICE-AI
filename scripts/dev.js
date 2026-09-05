import { spawn } from 'node:child_process';

// 1. Spawn Python FastAPI
const fastapi = spawn(
  'python3',
  ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', '8001'],
  { stdio: 'inherit' }
);

// 2. Spawn Vite on port 3000
const vite = spawn(
  'npx',
  ['vite', '--host', '0.0.0.0', '--port', '3000'],
  { stdio: 'inherit' }
);

const cleanup = () => {
  try {
    fastapi.kill('SIGTERM');
  } catch (e) {}
  try {
    vite.kill('SIGTERM');
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

fastapi.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`FastAPI process exited with code ${code}`);
  }
});

vite.on('exit', (code) => {
  cleanup();
});
