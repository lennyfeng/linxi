#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

echo "=== List Accounts (pageSize=100) ==="
curl -s "http://localhost:3101/ledger/accounts?pageSize=100" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== List Categories (pageSize=100) ==="
curl -s "http://localhost:3101/ledger/categories?pageSize=100" \
  -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("code:",d.get("code"),"list_count:",len(d.get("data",{}).get("list",[])))'
