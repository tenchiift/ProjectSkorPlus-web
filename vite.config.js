import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', reject);
  });
}

// Runs the Vercel serverless functions in api/ inside the Vite dev server,
// so the AI endpoints work with plain `npm run dev`. Vercel still serves
// them in production — this middleware only exists during development.
function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const route = req.url.split('?')[0].replace(/^\//, '');
        const funcFile = path.resolve(process.cwd(), 'api', `${route}.js`);
        if (!existsSync(funcFile)) return next();

        try {
          req.body = await readJsonBody(req);
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (obj) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
          };

          // Cache-bust by mtime so api/ edits apply without a server restart.
          const mtime = statSync(funcFile).mtimeMs;
          const mod = await import(`${pathToFileURL(funcFile).href}?t=${mtime}`);
          await mod.default(req, res);
        } catch (err) {
          console.error(`[api] ${route} crashed:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
          }
          res.end(JSON.stringify({ error: 'Local function error.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Expose .env / .env.local vars (non-VITE_ ones) to the api/ functions,
  // mirroring how Vercel injects environment variables server-side.
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('VITE_')) process.env[key] ??= value;
  }

  return {
    plugins: [react(), localApiPlugin()],
    server: { port: 5173 },
  };
});
