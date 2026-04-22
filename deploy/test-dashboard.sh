#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

echo "=== Dashboard ==="
curl -s http://localhost:3101/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
