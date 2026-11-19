import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const action = process.argv[2];
if (!['build', 'start'].includes(action)) throw new Error('Usá build o start.');
const args = action === 'build' ? ['build', '--webpack'] : ['start', '--hostname', '127.0.0.1', '--port', process.env.PORT || '3002'];
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), ...args], {
  env: { ...process.env, TIEMPOS_BUILD_DIR: '.next-check/pwa' }, stdio: 'inherit',
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
