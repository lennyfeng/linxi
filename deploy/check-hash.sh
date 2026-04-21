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
mysql --defaults-extra-file="$MYCNF" --protocol=tcp internal_platform -e "SELECT id, username, display_name, LEFT(password_hash,20) AS hash_prefix, LENGTH(password_hash) AS hash_len, status FROM users"
rm -f "$MYCNF"
