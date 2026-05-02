import 'dotenv/config';
import { AppModule } from './modules/app.module.js';
import { handleAuthRoutes } from './modules/auth/index.js';
import { handleUsersRoutes } from './modules/users/index.js';
import { handleLedgerRoutes } from './modules/ledger/index.js';
import { handleReconciliationRoutes } from './modules/reconciliation/index.js';
import { handleProductDevRoutes } from './modules/product-dev/index.js';
import { handleAsinOpportunityRoutes } from './modules/asin-opportunities/index.js';
import { handleSavedViewsRoutes } from './modules/saved-views/index.js';
import { handleSettingsRoutes } from './modules/settings/index.js';
import { handleDashboardRoutes } from './modules/dashboard/index.js';
import { handleNotificationsRoutes } from './modules/notifications/index.js';
import { handleApprovalsRoutes } from './modules/approvals/index.js';
import { handleSearchRoutes } from './modules/search/index.js';
import { handleAuditLogRoutes } from './modules/audit-log/index.js';
import { handleSyncJobsRoutes } from './modules/sync-jobs/index.js';
import { getAppConfig } from './config/app.config.js';
import { getDatabaseHealth } from './database/index.js';
import { getErrorResponse, getRouteNotFound } from './common/errors.js';
import { sendJson } from './common/send.js';
import { createRequestContext } from './common/context.js';
import { applyAuthContext } from './common/auth-middleware.js';
import { flushAuditLogs } from './common/audit.js';
import { createServer } from 'node:http';

const config = getAppConfig();

const server = createServer(async (req, res) => {
  const ctx = createRequestContext(req);
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    await applyAuthContext(req, url, ctx);

    if (url.pathname === '/health') {
      sendJson(res, { app: config.appName, db: await getDatabaseHealth() }, { requestId: ctx.requestId });
      return;
    }

    if (url.pathname === '/modules') {
      sendJson(res, AppModule.modules, { requestId: ctx.requestId });
      return;
    }

    if (url.pathname === '/') {
      sendJson(res, {
        app: config.appName,
        status: 'ok',
        nodeEnv: config.nodeEnv,
        modules: AppModule.modules.map((item) => item.name),
      }, { requestId: ctx.requestId });
      return;
    }

    const handled =
      (await handleAuthRoutes(req, res, url, ctx)) ||
      (await handleSavedViewsRoutes(req, res, url, ctx)) ||
      (await handleUsersRoutes(req, res, url, ctx)) ||
      (await handleLedgerRoutes(req, res, url, ctx)) ||
      (await handleReconciliationRoutes(req, res, url, ctx)) ||
      (await handleProductDevRoutes(req, res, url, ctx)) ||
      (await handleAsinOpportunityRoutes(req, res, url, ctx)) ||
      (await handleSettingsRoutes(req, res, url, ctx)) ||
      (await handleDashboardRoutes(req, res, url, ctx)) ||
      (await handleNotificationsRoutes(req, res, url, ctx)) ||
      (await handleApprovalsRoutes(req, res, url, ctx)) ||
      (await handleSearchRoutes(req, res, url, ctx)) ||
      (await handleAuditLogRoutes(req, res, url, ctx)) ||
      (await handleSyncJobsRoutes(req, res, url, ctx));

    if (handled) {
      try { await flushAuditLogs(ctx); } catch (e) { console.error('[audit-flush]', e); }
      return;
    }

    res.writeHead(404, {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Request-Id': ctx.requestId,
    });
    res.end(JSON.stringify(getRouteNotFound(url.pathname, ctx.requestId)));
  } catch (error) {
    const response = getErrorResponse(error, ctx.requestId);
    if (!res.headersSent) {
      res.writeHead(response.statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Request-Id': ctx.requestId,
      });
      res.end(JSON.stringify(response.body));
    } else {
      console.error('[unhandled-after-send]', error);
    }
  }
});

server.listen(config.port, () => {
  console.log(`${config.appName} listening on ${config.port}`);
});
