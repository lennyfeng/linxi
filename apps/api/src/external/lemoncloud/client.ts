import { query } from '../../database/index.js';

const BASE_URL = 'https://open2.ningmengyun.com';

interface LemonCloudCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
}

/**
 * Get Lemon Cloud credentials from settings table.
 */
async function getCredentials(): Promise<LemonCloudCredentials> {
  const rows = await query<{ setting_value: string }>(
    "SELECT setting_value FROM settings WHERE setting_key = 'lemoncloud_credentials' LIMIT 1",
  );
  if (rows[0]) {
    try {
      const val = JSON.parse(rows[0].setting_value);
      return {
        appKey: val.appKey || '',
        appSecret: val.appSecret || '',
        accessToken: val.accessToken || '',
      };
    } catch { /* fallback */ }
  }
  return {
    appKey: process.env.LEMONCLOUD_APP_KEY || '',
    appSecret: process.env.LEMONCLOUD_APP_SECRET || '',
    accessToken: process.env.LEMONCLOUD_ACCESS_TOKEN || '',
  };
}

/**
 * Make an API request to Lemon Cloud.
 */
export async function lemoncloudRequest<T = unknown>(
  path: string,
  body: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {
  const creds = await getCredentials();

  if (!creds.accessToken) {
    throw new Error('Lemon Cloud access token not configured. Set it in Settings → Integrations.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${creds.accessToken}`,
  };

  const url = `${BASE_URL}${path}`;

  const fetchOptions: RequestInit = { method, headers };
  if (method === 'POST') {
    fetchOptions.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOptions);
  if (!res.ok) {
    throw new Error(`Lemon Cloud API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json() as { code: number; data: T; msg?: string };
  if (json.code !== 0 && json.code !== 200) {
    throw new Error(`Lemon Cloud error code ${json.code}: ${json.msg || 'unknown'}`);
  }

  return json.data;
}
