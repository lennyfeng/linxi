import crypto from 'node:crypto';
import { query } from '../../database/index.js';

const BASE_URL = 'https://openapi.lingxing.com';

interface LingxingTokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: LingxingTokenCache | null = null;

async function getCredentials(): Promise<{ appId: string; appSecret: string }> {
  const rows = await query<{ setting_value: string }>(
    "SELECT setting_value FROM settings WHERE setting_key = 'lingxing_credentials' LIMIT 1",
  );
  if (rows[0]) {
    try {
      const val = JSON.parse(rows[0].setting_value);
      return { appId: val.appId || '', appSecret: val.appSecret || '' };
    } catch { /* fallback */ }
  }
  return {
    appId: process.env.LINGXING_APP_ID || 'ak_lxYsroy8y1VK9',
    appSecret: process.env.LINGXING_APP_SECRET || 'S6VOAQcQ7pWSlLw/fWNB6w==',
  };
}

async function acquireToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const { appId, appSecret } = await getCredentials();

  const res = await fetch(`${BASE_URL}/api/auth-server/oauth/access-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ appId, appSecret }),
  });

  if (!res.ok) {
    throw new Error(`Lingxing auth failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as { code: number; data: { access_token: string; expires_in: number } };
  if (json.code !== 0 || !json.data?.access_token) {
    throw new Error(`Lingxing auth error: ${JSON.stringify(json)}`);
  }

  tokenCache = {
    accessToken: json.data.access_token,
    expiresAt: Date.now() + (json.data.expires_in - 300) * 1000,
  };

  return tokenCache.accessToken;
}

function generateSign(accessToken: string, appKey: string, timestamp: string): string {
  const raw = `${accessToken}${appKey}${timestamp}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

export async function lingxingRequest<T = unknown>(
  path: string,
  body: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const accessToken = await acquireToken();
  const { appId } = await getCredentials();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sign = generateSign(accessToken, appId, timestamp);

  const params = new URLSearchParams({
    access_token: accessToken,
    timestamp,
    sign,
    app_key: appId,
  });

  const url = `${BASE_URL}${path}?${params.toString()}`;

  const fetchOptions: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (method === 'POST') {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    throw new Error(`Lingxing API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as { code: number; data: T; msg?: string };
  if (json.code !== 0) {
    throw new Error(`Lingxing API error code ${json.code}: ${json.msg || 'unknown'}`);
  }

  return json.data;
}

export function clearTokenCache(): void {
  tokenCache = null;
}
