#!/bin/bash
# Reset admin password to admin123
NEW_HASH=$(docker exec internal-platform-api node -e "const b=require('bcryptjs');b.hash('admin123',10).then(h=>console.log(h));")
echo "New hash: $NEW_HASH"
mysql -u linxi_app -pLinxi@sql internal_platform -e "UPDATE users SET password_hash='$NEW_HASH' WHERE username='admin';"
echo "Password updated"

# Verify login
RESP=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}')
echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print("Login:", "OK" if d.get("code")==0 else "FAILED")'
