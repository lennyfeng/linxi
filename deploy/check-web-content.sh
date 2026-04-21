#!/bin/bash
echo "=== Web container files ==="
docker exec internal-platform-web ls -la /app/src/
echo ""
echo "=== dev-server.js content ==="
docker exec internal-platform-web cat /app/src/dev-server.js
echo ""
echo "=== index.html check ==="
docker exec internal-platform-web cat /app/src/index.html 2>/dev/null | head -20
echo ""
echo "=== What pages exist ==="
docker exec internal-platform-web find /app/src/pages -name "*.tsx" 2>/dev/null | head -20
echo ""
echo "=== Host src dir ==="
ls /home/sql/internal-platform/apps/web/src/ | head -20
