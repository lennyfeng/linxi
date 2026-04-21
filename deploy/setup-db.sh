#!/bin/bash
set -e

DB=internal_platform
MIGRATION_DIR=/home/sql/internal-platform/apps/api/src/database/migrations
MYCNF=/tmp/.deploy-my.cnf

# Write temp config to avoid shell escaping issues with #
cat > "$MYCNF" <<'EOF'
[client]
user=linxi_app
password=Linxi@sql
host=127.0.0.1
port=3306
EOF
chmod 600 "$MYCNF"

MYSQL_CMD="mysql --defaults-extra-file=$MYCNF --protocol=tcp"

echo "=== Creating database ==="
$MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "Database ready"

echo "=== Running migrations ==="
for f in $MIGRATION_DIR/*.sql; do
  echo "  Running $(basename $f) ..."
  $MYSQL_CMD $DB < "$f"
done

echo "=== Verifying tables ==="
$MYSQL_CMD $DB -e "SHOW TABLES;"

# Cleanup
rm -f "$MYCNF"
echo "=== Done ==="
