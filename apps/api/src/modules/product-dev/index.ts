import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import {
  createProfitCalculation,
  createProject,
  createQuote,
  createSample,
  createSync,
  deleteProfitCalculation,
  deleteProject,
  deleteQuote,
  deleteSample,
  deleteSync,
  getProfitCalculations,
  getProjectDetail,
  getProjects,
  getQuotes,
  getSyncRecords,
  updateProfitCalculation,
  updateProject,
  updateQuote,
  updateSample,
  updateSync,
  transitionProjectStatus,
  approveProject,
  rejectProject,
  getPreSyncCheck,
} from './service/product-dev.service.js';

export const productDevModule = {
  name: 'product-dev',
  description: 'Product development workflow and Lingxing sync',
  routes: [
    '/product-dev/projects',
    '/product-dev/projects/:id',
    '/product-dev/quotes',
    '/product-dev/quotes/:id',
    '/product-dev/profit-calculations',
    '/product-dev/profit-calculations/:id',
    '/product-dev/sync-records',
    '/product-dev/sync-records/:id',
    '/product-dev/samples',
    '/product-dev/samples/:id',
  ],
};

export const handleProductDevRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/product-dev/projects') {
    sendJson(res, await getProjects(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/product-dev/projects') {
    const body = await readJsonBody(req);
    sendJson(res, await createProject(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  // --- Project workflow routes (must come before generic GET/PUT /projects/:id) ---
  if (req.method === 'POST' && url.pathname.match(/^\/product-dev\/projects\/\d+\/transition$/)) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    const body = await readJsonBody(req);
    sendJson(res, await transitionProjectStatus(id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/product-dev\/projects\/\d+\/approve$/)) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    const body = await readJsonBody(req);
    sendJson(res, await approveProject(id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/product-dev\/projects\/\d+\/reject$/)) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    const body = await readJsonBody(req);
    sendJson(res, await rejectProject(id, body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/product-dev\/projects\/\d+\/pre-sync-check$/)) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    sendJson(res, await getPreSyncCheck(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/product-dev/projects/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    sendJson(res, await getProjectDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/product-dev/projects/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    const body = await readJsonBody(req);
    sendJson(res, await updateProject(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/product-dev/projects/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/projects/');
    sendJson(res, await deleteProject(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/product-dev/quotes') {
    sendJson(res, await getQuotes(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/product-dev/quotes') {
    const body = await readJsonBody(req);
    sendJson(res, await createQuote(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/product-dev/quotes/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/quotes/');
    const body = await readJsonBody(req);
    sendJson(res, await updateQuote(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/product-dev/quotes/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/quotes/');
    sendJson(res, await deleteQuote(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/product-dev/profit-calculations') {
    sendJson(res, await getProfitCalculations(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/product-dev/profit-calculations') {
    const body = await readJsonBody(req);
    sendJson(res, await createProfitCalculation(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/product-dev/profit-calculations/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/profit-calculations/');
    const body = await readJsonBody(req);
    sendJson(res, await updateProfitCalculation(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/product-dev/profit-calculations/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/profit-calculations/');
    sendJson(res, await deleteProfitCalculation(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/product-dev/sync-records') {
    sendJson(res, await getSyncRecords(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/product-dev/sync-records') {
    const body = await readJsonBody(req);
    sendJson(res, await createSync(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/product-dev/sync-records/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/sync-records/');
    const body = await readJsonBody(req);
    sendJson(res, await updateSync(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/product-dev/sync-records/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/sync-records/');
    sendJson(res, await deleteSync(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/product-dev/samples') {
    const body = await readJsonBody(req);
    sendJson(res, await createSample(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/product-dev/samples/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/samples/');
    const body = await readJsonBody(req);
    sendJson(res, await updateSample(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/product-dev/samples/')) {
    const id = getIdFromPath(url.pathname, '/product-dev/samples/');
    sendJson(res, await deleteSample(id), responseOptions);
    return true;
  }

  return false;
};
