#!/bin/bash
echo "=== Test 1: Login via web proxy ==="
LOGIN_RESP=$(curl -s -X POST http://localhost:3201/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}')
echo "$LOGIN_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("code:", d.get("code"), "has_token:", bool(d.get("data",{}).get("access_token")))' 2>&1 || echo "PARSE ERROR: $LOGIN_RESP"

TOKEN=$(echo "$LOGIN_RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))' 2>/dev/null)

echo ""
echo "=== Test 2: API call via /api/ proxy ==="
curl -s http://localhost:3201/api/product-dev/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("code:", d.get("code"), "data_type:", type(d.get("data")).__name__, "len:", len(d.get("data",[])) if isinstance(d.get("data"),list) else "N/A")' 2>&1

echo ""
echo "=== Test 3: Check /api/auth/login response directly ==="
curl -s -X POST http://localhost:3201/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | head -c 200

echo ""
echo ""
echo "=== Test 4: Static assets accessible? ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3201/assets/index-BSgB0-m7.js
echo ""

echo ""
echo "=== Test 5: Direct page navigation (Accept: text/html) ==="
curl -s -o /dev/null -w "HTTP %{http_code} size=%{size_download}" -H "Accept: text/html" http://localhost:3201/product-dev/projects
echo ""
curl -s -o /dev/null -w "HTTP %{http_code} size=%{size_download}" -H "Accept: text/html" http://localhost:3201/ledger/transactions
echo ""
curl -s -o /dev/null -w "HTTP %{http_code} size=%{size_download}" -H "Accept: text/html" http://localhost:3201/dashboard
echo ""
