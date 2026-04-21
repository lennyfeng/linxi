import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { createSavedView, deleteSavedView, getSavedViews, updateSavedView } from './service/saved-views.service.js';

export const savedViewsModule = {
  name: 'saved-views',
  description: 'Shared saved views base service',
  routes: ['/saved-views', '/saved-views/:id'],
};

export const handleSavedViewsRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/saved-views') {
    sendJson(res, await getSavedViews(ctx, Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/saved-views') {
    const body = await readJsonBody(req);
    sendJson(res, await createSavedView(ctx, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/saved-views/')) {
    const id = getIdFromPath(url.pathname, '/saved-views/');
    const body = await readJsonBody(req);
    sendJson(res, await updateSavedView(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/saved-views/')) {
    const id = getIdFromPath(url.pathname, '/saved-views/');
    sendJson(res, await deleteSavedView(ctx, id), responseOptions);
    return true;
  }

  return false;
};
