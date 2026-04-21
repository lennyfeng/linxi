#!/bin/bash
set -e

DB=internal_platform
MIGRATION_DIR=/home/sql/internal-platform/apps/api/src/database/migrations
MYCNF=/tmp/.deploy-my.cnf

cat > "$MYCNF" <<'EOF'
[client]
user=linxi_app
password=Linxi@sql
host=127.0.0.1
port=3306
EOF
chmod 600 "$MYCNF"

MYSQL_CMD="mysql --defaults-extra-file=$MYCNF --protocol=tcp"
DUMP_CMD="mysqldump --defaults-extra-file=$MYCNF --protocol=tcp"

echo "=== Step 1: Backup old database ==="
$DUMP_CMD $DB > /home/sql/internal_platform_backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null && echo "Backup saved" || echo "No existing data to backup"

echo "=== Step 2: Drop and recreate database ==="
$MYSQL_CMD -e "DROP DATABASE IF EXISTS $DB; CREATE DATABASE $DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "Database recreated"

echo "=== Step 3: Running migrations ==="
for f in $(ls $MIGRATION_DIR/*.sql | sort); do
  BASE=$(basename "$f")
  # Skip 006 — it's an incremental patch already included in 001
  if [ "$BASE" = "006_add_password_fields.sql" ]; then
    echo "  Skipping $BASE (already in 001)"
    continue
  fi
  echo "  Running $BASE ..."
  $MYSQL_CMD $DB < "$f"
done

echo "=== Step 4: Verifying tables ==="
$MYSQL_CMD $DB -e "SHOW TABLES;"

echo "=== Step 5: Verify key structures ==="
$MYSQL_CMD $DB -e "DESCRIBE users; DESCRIBE roles;"

rm -f "$MYCNF"
echo "=== Database rebuild complete ==="
