import type { IncomingMessage } from 'node:http';
import { ErrorCodes } from './error-codes.js';
import { AppError } from './errors.js';
import type { JsonBody } from './types.js';

export async function readJsonBody(req: IncomingMessage): Promise<JsonBody> {
  return await new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new AppError(400, 'invalid_json_body', { details: null }, ErrorCodes.INVALID_JSON_BODY));
      }
    });

    req.on('error', reject);
  });
}
