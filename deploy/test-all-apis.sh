#!/bin/bash
# Full API test after fixes
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Linxi#sql23"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

if [ -z "$TOKEN" ]; then
  echo "FAILED to get token"
  exit 1
fi
echo "Token: ${TOKEN:0:20}..."
AUTH="Authorization: Bearer $TOKEN"
CT="Content-Type: application/json"

echo ""
echo "=== 1. GET /sync-jobs ==="
curl -s http://localhost:3101/sync-jobs -H "$AUTH" | python3 -m json.tool

echo ""
echo "=== 2. GET /settings ==="
curl -s http://localhost:3101/settings -H "$AUTH" | python3 -m json.tool

echo ""
echo "=== 3. POST /users/sync-lingxing ==="
curl -s -X POST http://localhost:3101/users/sync-lingxing -H "$AUTH" | python3 -m json.tool

echo ""
echo "=== 4. POST /reconciliation/sync/suppliers ==="
curl -s -X POST http://localhost:3101/reconciliation/sync/suppliers -H "$AUTH" -H "$CT" -d '{}' | python3 -m json.tool

echo ""
echo "=== 5. POST /reconciliation/sync/purchase-orders ==="
curl -s -X POST http://localhost:3101/reconciliation/sync/purchase-orders -H "$AUTH" -H "$CT" -d '{}' | python3 -m json.tool

echo ""
echo "=== 6. POST /reconciliation/sync/payment-requests ==="
curl -s -X POST http://localhost:3101/reconciliation/sync/payment-requests -H "$AUTH" -H "$CT" -d '{}' | python3 -m json.tool

echo ""
echo "=== 7. POST /reconciliation/sync/delivery-orders ==="
curl -s -X POST http://localhost:3101/reconciliation/sync/delivery-orders -H "$AUTH" -H "$CT" -d '{}' | python3 -m json.tool

echo ""
echo "=== Done ==="
