#!/bin/bash
echo "=== Direct API login ==="
curl -s -X POST http://127.0.0.1:3101/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>&1

echo ""
echo "=== Via web proxy ==="
curl -s -X POST http://127.0.0.1:3201/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>&1

echo ""
echo "=== API logs after request ==="
docker logs internal-platform-api --tail 20 2>&1
