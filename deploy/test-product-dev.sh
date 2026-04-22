#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("access_token",""))')

echo "=== GET /product-dev/projects ==="
RESP=$(curl -s http://localhost:3101/product-dev/projects -H "Authorization: Bearer $TOKEN")
echo "$RESP" | python3 -c '
import sys, json
d = json.load(sys.stdin)
data = d.get("data")
print("code:", d.get("code"))
print("data type:", type(data).__name__)
if isinstance(data, list):
    print("data length:", len(data))
    if data:
        print("first item keys:", list(data[0].keys()))
elif isinstance(data, dict):
    print("data keys:", list(data.keys()))
    items = data.get("items") or data.get("list")
    if items:
        print("items length:", len(items))
        if items:
            print("first item keys:", list(items[0].keys()))
'

echo ""
echo "=== Raw response (first 1000 chars) ==="
echo "$RESP" | python3 -c 'import sys; print(sys.stdin.read()[:1000])'

echo ""
echo "=== Check web container logs ==="
docker logs internal-platform-web --tail 10 2>&1

echo ""
echo "=== Check if web serves /product-dev/projects ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3200/product-dev/projects
echo ""
