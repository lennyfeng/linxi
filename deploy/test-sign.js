const crypto = require('crypto');

// Verify with doc example
const qs = 'access_token=fa01206d-8587-4036-b178-5e4845156583&app_key=ak_lxYsroy8y1VK9&timestamp=1776263637';
const md5 = crypto.createHash('md5').update(qs).digest('hex').toUpperCase();
console.log('MD5:', md5);
console.log('MD5 match:', md5 === '2C8E7F9AE76C34C9412C1E48C749A50F');

const key = Buffer.from('ak_lxYsroy8y1VK9', 'utf8');
const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
let enc = cipher.update(md5, 'utf8', 'base64');
enc += cipher.final('base64');
console.log('AES:', enc);
console.log('AES match:', enc === 'vuR5cTSSzq6HPj7wJXX5yongvcq/1Nra2leQFctWrDxrlCsrI+jnGpua+lbmOlti');

// Now do a LIVE test: get token, generate sign, call API
async function liveTest() {
  const APP_ID = 'ak_lxYsroy8y1VK9';
  const APP_SECRET = 'S6VOAQcQ7pWSlLw/fWNB6w==';

  // Step 1: Get token
  const formData = new FormData();
  formData.append('appId', APP_ID);
  formData.append('appSecret', APP_SECRET);

  const authRes = await fetch('https://openapi.lingxing.com/api/auth-server/oauth/access-token', {
    method: 'POST',
    body: formData,
  });
  const authJson = await authRes.json();
  console.log('\nAuth response:', JSON.stringify(authJson));

  const accessToken = authJson.data?.access_token;
  if (!accessToken) {
    console.log('FAILED to get token');
    return;
  }

  // Step 2: Generate sign
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signStr = `access_token=${accessToken}&app_key=${APP_ID}&timestamp=${timestamp}`;
  console.log('Sign string:', signStr);

  const signMd5 = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  console.log('Sign MD5:', signMd5);

  const signCipher = crypto.createCipheriv('aes-128-ecb', key, null);
  let sign = signCipher.update(signMd5, 'utf8', 'base64');
  sign += signCipher.final('base64');
  console.log('Sign (raw base64):', sign);

  const signEncoded = encodeURIComponent(sign);
  console.log('Sign (URL encoded):', signEncoded);

  // Step 3: Call user list API
  const url = `https://openapi.lingxing.com/erp/sc/data/account/lists?access_token=${encodeURIComponent(accessToken)}&timestamp=${timestamp}&sign=${signEncoded}&app_key=${APP_ID}`;
  console.log('\nRequest URL:', url);

  const apiRes = await fetch(url);
  const apiText = await apiRes.text();
  console.log('API Response:', apiText.substring(0, 500));
}

liveTest().catch(console.error);
