#!/bin/bash
# Dump raw API responses to check field names
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Linxi#sql23"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

echo "Token: ${TOKEN:0:20}..."
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

# Dump first purchase order raw_data from DB
echo ""
echo "=== Purchase Orders: First raw response from Lingxing ==="
docker exec internal-platform-api node -e "
const { lingxingRequest } = require('./dist/external/lingxing/client.js');
(async () => {
  try {
    const end = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now() - 90*86400000).toISOString().slice(0,10);
    const r = await lingxingRequest('/erp/sc/routing/data/local_inventory/purchaseOrderList', {offset:0,length:1,start_date:start,end_date:end,search_field_time:'update_time'});
    console.log(JSON.stringify(r).substring(0, 2000));
  } catch(e) { console.log('Error:', e.message); }
})();
" 2>&1

echo ""
echo "=== Payment Requests: First raw response from Lingxing ==="
docker exec internal-platform-api node -e "
const { lingxingRequest } = require('./dist/external/lingxing/client.js');
(async () => {
  try {
    const end = new Date().toISOString().slice(0,10);
    const start = new Date(Date.now() - 90*86400000).toISOString().slice(0,10);
    const r = await lingxingRequest('/basicOpen/finance/requestFunds/order/list', {offset:0,length:1,start_date:start,end_date:end,search_field_time:'apply_time'});
    console.log(JSON.stringify(r).substring(0, 2000));
  } catch(e) { console.log('Error:', e.message); }
})();
" 2>&1
