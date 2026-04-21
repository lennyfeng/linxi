import type { IncomingMessage, ServerResponse } from 'http';

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');

export function corsMiddleware(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin || '';

  if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  return false;
}
