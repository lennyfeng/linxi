#!/bin/bash
# Generate correct bcrypt hash inside container and update DB
HASH=$(docker exec internal-platform-api node -e "require('bcryptjs').hash('admin123',10).then(h=>process.stdout.write(h))")
echo "Generated hash: $HASH"

MYCNF=/tmp/.deploy-my.cnf
cat > "$MYCNF" <<'EOF'
[client]
user=linxi_app
password=Linxi@sql
host=127.0.0.1
port=3306
EOF
chmod 600 "$MYCNF"

cat > /tmp/fix-pwd.sql <<EOSQL
UPDATE users SET password_hash='$HASH' WHERE username='admin';
SELECT id, username, LEFT(password_hash,20) AS hash_prefix FROM users WHERE username='admin';
EOSQL

mysql --defaults-extra-file="$MYCNF" --protocol=tcp internal_platform < /tmp/fix-pwd.sql
rm -f "$MYCNF" /tmp/fix-pwd.sql
echo "=== Password updated ==="
