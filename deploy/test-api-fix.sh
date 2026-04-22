#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"linxi123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("data",{}).get("token",""))')

echo "=== sync-jobs ==="
curl -s http://localhost:3101/sync-jobs -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== settings ==="
curl -s http://localhost:3101/settings -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== sync-users (lingxing) ==="
curl -s -X POST http://localhost:3101/users/sync-lingxing -H "Authorization: Bearer $TOKEN"
echo ""
