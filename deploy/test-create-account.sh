#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

echo "=== Token: ${TOKEN:0:20}... ==="

# Test 1: Create account with exactly the same payload the frontend sends
echo ""
echo "=== Test 1: Create Account ==="
curl -s -X POST http://localhost:3101/ledger/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"accountName":"Debug Test Account","accountType":"bank","currency":"CNY","openingBalance":0,"currentBalance":0,"status":"active"}' | python3 -m json.tool

# Test 2: List accounts to see what was created
echo ""
echo "=== Test 2: List Accounts ==="
curl -s http://localhost:3101/ledger/accounts?pageSize=200 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
