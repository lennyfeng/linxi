import crypto from 'node:crypto';

const BASE_URL = 'https://openapi.lingxing.com';
const APP_ID = 'ak_lxYsroy8y1VK9';
const APP_SECRET = 'S6VOAQcQ7pWSlLw/fWNB6w==';

async function getToken() {
  const fd = new FormData();
  fd.append('appId', APP_ID);
  fd.append('appSecret', APP_SECRET);
  const r = await fetch(`${BASE_URL}/api/auth-server/oauth/access-token`, { method: 'POST', body: fd });
  const j = await r.json();
  return j.data.access_token;
}

function makeSign(params) {
  const sorted = Object.keys(params).sort();
  const qs = sorted.filter(k => params[k] !== '' && params[k] !== undefined).map(k => `${k}=${params[k]}`).join('&');
  const md5 = crypto.createHash('md5').update(qs).digest('hex').toUpperCase();
  const key = Buffer.from(APP_ID, 'utf8');
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  let enc = cipher.update(md5, 'utf8', 'base64');
  enc += cipher.final('base64');
  return enc;
}

async function apiCall(path, body = {}, method = 'POST') {
  const token = await getToken();
  const ts = String(Math.floor(Date.now() / 1000));
  const flat = {};
  for (const [k, v] of Object.entries(body)) {
    if (v !== null && v !== undefined && v !== '' && typeof v !== 'object') flat[k] = String(v);
  }
  const signParams = { ...flat, access_token: token, app_key: APP_ID, timestamp: ts };
  const sign = makeSign(signParams);
  const qs = new URLSearchParams({ access_token: token, timestamp: ts, sign, app_key: APP_ID });
  const url = `${BASE_URL}${path}?${qs}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (method === 'POST') opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

// Dump first purchase order
const end = new Date().toISOString().slice(0, 10);
const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

console.log('=== Purchase Orders ===');
const po = await apiCall('/erp/sc/routing/data/local_inventory/purchaseOrderList', { offset: 0, length: 1, start_date: start, end_date: end });
const poItem = Array.isArray(po.data) ? po.data[0] : (po.data?.list?.[0] || po.data);
console.log('Keys:', poItem ? Object.keys(poItem) : 'no data');
console.log('Sample:', JSON.stringify(poItem).substring(0, 1000));

console.log('\n=== Payment Requests ===');
const pr = await apiCall('/basicOpen/finance/requestFunds/order/list', { offset: 0, length: 1, start_date: start, end_date: end, search_field_time: 'apply_time' });
const prItem = Array.isArray(pr.data) ? pr.data[0] : (pr.data?.list?.[0] || pr.data);
console.log('Keys:', prItem ? Object.keys(prItem) : 'no data');
console.log('Sample:', JSON.stringify(prItem).substring(0, 1000));
