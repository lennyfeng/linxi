#!/bin/bash
echo "=== Admin user info ==="
mysql -u linxi_app -p'Linxi@sql' internal_platform -e "SELECT id, username, display_name, status, lingxing_uid, must_change_password, LEFT(password_hash,20) as hash_prefix FROM users WHERE username='admin' LIMIT 1;"

echo ""
echo "=== All users count ==="
mysql -u linxi_app -p'Linxi@sql' internal_platform -e "SELECT COUNT(*) as total FROM users;"

echo ""
echo "=== Try login with admin/admin123 ==="
RESP=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}')
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"

echo ""
echo "=== Try login with admin/Linxi#sql23 ==="
RESP2=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Linxi#sql23"}')
echo "$RESP2" | python3 -m json.tool 2>/dev/null || echo "$RESP2"

echo ""
echo "=== Try login with admin/linxi123 ==="
RESP3=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"linxi123"}')
echo "$RESP3" | python3 -m json.tool 2>/dev/null || echo "$RESP3"
