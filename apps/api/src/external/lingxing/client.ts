import crypto from 'node:crypto';
import { query } from '../../database/index.js';

const BASE_URL = 'https://openapi.lingxing.com';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getCredentials(): Promise<{ appId: string; appSecret: string }> {
  try {
    const rows = await query<{ val: string }>(
      "SELECT `value` AS val FROM settings WHERE `key` = 'lingxing_credentials' LIMIT 1",
    );
    if (rows[0]) {
      const val = JSON.parse(rows[0].val);
      if (val.appId && val.appSecret) {
        return { appId: val.appId, appSecret: val.appSecret };
      }
    }
  } catch { /* fallback to env / hardcoded */ }
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

  const formData = new FormData();
  formData.append('appId', appId);
  formData.append('appSecret', appSecret);

  const res = await fetch(`${BASE_URL}/api/auth-server/oauth/access-token`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Lingxing auth failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as { code: number | string; data: { access_token: string; refresh_token: string; expires_in: number }; msg?: string };
  if (!json.data?.access_token) {
    throw new Error(`Lingxing auth error: ${json.msg || JSON.stringify(json)}`);
  }

  tokenCache = {
    accessToken: json.data.access_token,
    expiresAt: Date.now() + (json.data.expires_in - 120) * 1000, // 2min buffer
  };

  return tokenCache.accessToken;
}

/**
 * Generate Lingxing API sign per official rules:
 * 1. Collect all params (business + access_token + app_key + timestamp), ASCII sort by key
 * 2. Join as key1=value1&key2=value2 (skip empty values, include null)
 * 3. MD5 (32-bit) → UPPERCASE
 * 4. AES/ECB/PKCS5Padding encrypt with AppId as key
 * 5. URL encode
 */
function generateSign(
  allParams: Record<string, string>,
  appId: string,
): string {
  // Step 1+2: Sort keys by ASCII, join as key=value (skip empty string values)
  const sorted = Object.keys(allParams).sort();
  const pairs = sorted
    .filter((k) => allParams[k] !== '' && allParams[k] !== undefined)
    .map((k) => `${k}=${allParams[k]}`);
  const queryString = pairs.join('&');

  // Step 3: MD5 32-char hex → UPPERCASE
  const md5Upper = crypto.createHash('md5').update(queryString).digest('hex').toUpperCase();

  // Step 4: AES/ECB/PKCS5Padding encrypt, key = AppId (must be 16 bytes for AES-128)
  const key = Buffer.from(appId, 'utf8');
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(true); // PKCS5/PKCS7
  let encrypted = cipher.update(md5Upper, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Return raw base64; caller handles URL encoding (e.g. URLSearchParams)
  return encrypted;
}

/**
 * Flatten body params to string values for sign calculation.
 * Only top-level keys; skip values that are objects/arrays.
 */
function flattenParams(body: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === null) {
      result[k] = 'null';
    } else if (v === undefined || v === '') {
      // skip empty
    } else if (typeof v === 'object') {
      // skip nested objects/arrays from sign
    } else {
      result[k] = String(v);
    }
  }
  return result;
}

/**
 * Make an authenticated request to Lingxing Open API.
 */
export async function lingxingRequest<T = unknown>(
  path: string,
  body: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const accessToken = await acquireToken();
  const { appId } = await getCredentials();
  const timestamp = String(Math.floor(Date.now() / 1000));

  // Build sign params: business params + fixed params
  const signParams: Record<string, string> = {
    ...flattenParams(body),
    access_token: accessToken,
    app_key: appId,
    timestamp,
  };

  const sign = generateSign(signParams, appId);

  // Query string for auth
  const qs = new URLSearchParams({
    access_token: accessToken,
    timestamp,
    sign,
    app_key: appId,
  });

  const url = `${BASE_URL}${path}?${qs.toString()}`;

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

  const json = await res.json() as { code: number | string; data: T; msg?: string; message?: string };
  if (json.code != 0 && json.code !== '200' && json.code !== 200) {
    throw new Error(`Lingxing API error code ${json.code}: ${json.msg || json.message || 'unknown'}`);
  }

  return json.data;
}

export function clearTokenCache(): void {
  tokenCache = null;
}
