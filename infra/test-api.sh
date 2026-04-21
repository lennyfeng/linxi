#!/bin/bash
BASE="http://localhost:3101"

echo "=== 1. Health Check ==="
curl -s "$BASE/health" | python3 -m json.tool

echo ""
echo "=== 2. Login ==="
LOGIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}')
echo "$LOGIN_RESP" | python3 -m json.tool

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('access_token',''))")
echo "TOKEN: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "Login failed, skipping auth tests"
  exit 1
fi

echo ""
echo "=== 3. GET /users ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/users" | python3 -m json.tool

echo ""
echo "=== 4. GET /departments ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/departments" | python3 -m json.tool

echo ""
echo "=== 5. GET /ledger/accounts ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/ledger/accounts" | python3 -m json.tool

echo ""
echo "=== 6. GET /ledger/categories ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/ledger/categories" | python3 -m json.tool

echo ""
echo "=== 7. GET /reconciliation/purchase-orders ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/reconciliation/purchase-orders" | python3 -m json.tool

echo ""
echo "=== 8. GET /product-dev/projects ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/product-dev/projects" | python3 -m json.tool

echo ""
echo "=== 9. GET /auth/me ==="
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/auth/me" | python3 -m json.tool

echo ""
echo "=== ALL TESTS DONE ==="
