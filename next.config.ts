import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

// El despliegue necesita las revisiones publicadas; el historial de recuperación queda en el repositorio.
const publishedFiles = ['f1', 'tc', 'tn'].flatMap((category) => {
  const directory = `./data/archive/${category}/`;
  const index = JSON.parse(readFileSync(directory + 'index.json', 'utf8')) as { seasons: { year: number; file?: string }[] };
  return [directory + 'index.json', ...index.seasons.map((entry) => {
    const file = entry.file ?? String(entry.year);
    if (!/^(?:\d{4}|revisions\/[a-f\d]{64})$/.test(file)) throw new Error('Referencia de publicación inválida.');
    return directory + file + '.json';
  })];
});
const activeFiles = new Set(publishedFiles);
const sessionIndex=JSON.parse(readFileSync('./data/openf1/index.json','utf8')) as {sessions:{file:string}[]};
const sessionFiles=sessionIndex.sessions.map((entry)=>{if(!/^[a-f\d]{64}$/.test(entry.file))throw new Error('Referencia OpenF1 inválida.');return `./data/openf1/sessions/${entry.file}.json`;});
const retiredFiles = ['f1', 'tc', 'tn'].flatMap((category) => {
  const directory = `./data/archive/${category}/`;
  return [directory, directory + 'revisions/'].flatMap((path) => existsSync(path) ? readdirSync(path).filter((name) => name.endsWith('.json')).map((name) => path + name) : []);
}).filter((path) => !activeFiles.has(path));

const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  distDir: process.env.TIEMPOS_BUILD_DIR || '.next',
  outputFileTracingIncludes: {
    '/*': [...publishedFiles, './data/sync/status.json', './data/openf1/index.json', './data/openf1/telemetry.json', ...sessionFiles],
  },
  outputFileTracingExcludes: {
    '/*': retiredFiles,
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), screen-wake-lock=(self)' },
      ],
    }, {
      source: '/telemetria/:path*',
      headers: [{ key:'Cache-Control',value:'public, max-age=31536000, immutable' }],
    }, {
      source: '/sw.js',
      headers: [
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
      ],
    }];
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  register: false,
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
  globPublicPatterns: ['icons/*.png', 'competencias/*', 'offline.html', 'offline-reader.js', 'offline.css'],
});

export default process.env.NODE_ENV === 'development' ? config : withSerwist(config);
