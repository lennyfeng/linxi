import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RequestContext } from './context.js';

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  ctx: RequestContext,
) => Promise<boolean>;

export type JsonBody = Record<string, unknown>;
