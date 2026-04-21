import { readJsonBody } from '../../common/http.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { changePassword, getCurrentUserContext, getFeishuCallbackPlaceholder, loginWithLocal, logout, refreshAccessToken } from './service/auth.service.js';

export const authModule = {
  name: 'auth',
  description: 'Feishu login and local admin auth',
  routes: ['/health', '/modules', '/auth/login', '/auth/logout', '/auth/refresh', '/auth/me', '/auth/change-password', '/auth/feishu/callback'],
};

export const handleAuthRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'POST' && url.pathname === '/auth/login') {
    const body = await readJsonBody(req);
    sendJson(res, await loginWithLocal(body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/auth/logout') {
    sendJson(res, logout(ctx.token), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/auth/refresh') {
    const body = await readJsonBody(req);
    sendJson(res, await refreshAccessToken(body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/auth/change-password') {
    const body = await readJsonBody(req);
    sendJson(res, await changePassword(ctx.token, body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/auth/me') {
    sendJson(res, await getCurrentUserContext(ctx.token), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/auth/feishu/callback') {
    sendJson(res, getFeishuCallbackPlaceholder(), responseOptions);
    return true;
  }

  return false;
};
