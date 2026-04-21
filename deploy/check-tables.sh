#!/bin/bash
MYCNF=/tmp/.deploy-my.cnf
cat > "$MYCNF" <<'EOF'
[client]
user=linxi_app
password=Linxi@sql
host=127.0.0.1
port=3306
EOF
chmod 600 "$MYCNF"
MYSQL_CMD="mysql --defaults-extra-file=$MYCNF --protocol=tcp internal_platform"

echo "=== Existing tables ==="
$MYSQL_CMD -e "SHOW TABLES" 2>&1

echo "=== roles structure ==="
$MYSQL_CMD -e "DESCRIBE roles" 2>&1

echo "=== users structure ==="
$MYSQL_CMD -e "DESCRIBE users" 2>&1

rm -f "$MYCNF"
