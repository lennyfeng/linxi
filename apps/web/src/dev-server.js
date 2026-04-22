import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3200);
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:3101';
const distDir = join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function serveStatic(pathname, res) {
  const filePath = join(distDir, pathname === '/' ? 'index.html' : pathname.slice(1));
  const content = await readFile(filePath);
  const ext = extname(filePath);
  const isAsset = pathname.startsWith('/assets/');
  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    ...(isAsset ? { 'Cache-Control': 'public, max-age=2592000, immutable' } : {}),
  });
  res.end(content);
}

function proxyApi(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const target = new URL(url.pathname.replace(/^\/api/, '') + url.search, apiTarget);

  fetch(target, {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'] || 'application/json',
      ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    duplex: 'half',
  }).then(async (upstream) => {
    res.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    });
    res.end(Buffer.from(await upstream.arrayBuffer()));
  }).catch((error) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 502, message: 'proxy_failed', data: { error: error.message, apiTarget } }));
  });
}

const API_PATH_PREFIXES = [
  '/auth/', '/users', '/departments', '/roles', '/permissions',
  '/health', '/modules', '/ledger/', '/reconciliation/', '/product-dev/',
  '/saved-views/', '/dashboard', '/notifications', '/approvals',
  '/search', '/audit-logs', '/settings', '/sync-jobs', '/files/',
];

function isApiPath(pathname) {
  if (pathname.startsWith('/api/')) return true;
  return API_PATH_PREFIXES.some((prefix) => pathname === prefix.replace(/\/$/, '') || pathname.startsWith(prefix));
}

createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const accept = req.headers.accept || '';
  const isNavigation = accept.includes('text/html');

  // Proxy to API only for XHR/fetch calls (not browser navigation)
  if (isApiPath(url.pathname) && !isNavigation) {
    proxyApi(req, res);
    return;
  }

  try {
    await serveStatic(url.pathname, res);
  } catch {
    // SPA fallback: serve index.html for all non-static paths
    try {
      await serveStatic('/', res);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    }
  }
}).listen(port, () => {
  console.log(`internal-platform web listening on ${port}`);
  console.log(`serving dist from ${distDir}`);
  console.log(`proxying api requests to ${apiTarget}`);
});
