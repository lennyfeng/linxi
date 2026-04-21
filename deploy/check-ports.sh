#!/bin/bash
echo "=== NEW API 3101 ==="
curl -s http://127.0.0.1:3101/health
echo ""

echo "=== NEW WEB 3201 ==="
curl -sI http://127.0.0.1:3201/ | head -5
echo ""

echo "=== OLD PROCESS on 3100 ==="
curl -s http://127.0.0.1:3100/health 2>&1 | head -3
echo ""

echo "=== OLD PROCESS on 80 ==="
curl -sI http://127.0.0.1:80/ | head -5
echo ""

echo "=== Who owns 3100 and 80? ==="
ss -tlnp | grep -E ":3100|:80 "
