#!/bin/bash
# Verify bcrypt match inside container
docker exec internal-platform-api node -e '
const b = require("bcryptjs");
const hash = "$2a$10$FDDdhMuo2pgiXppp5OLCfO5ZfRyf8VT8nJrnT9UdAgOYSrOHaucWi";
b.compare("Linxi#sql23", hash).then(r => console.log("bcrypt match:", r));
'

# Check API container logs for login errors
echo "=== Recent API logs ==="
docker logs internal-platform-api --tail 20 2>&1

# Try login via curl
echo "=== Login attempt ==="
RESP=$(curl -s -X POST http://localhost:3101/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Linxi#sql23"}')
echo "$RESP"
