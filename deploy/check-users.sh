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
mysql --defaults-extra-file="$MYCNF" --protocol=tcp internal_platform -e "SELECT id, username, display_name, status, password_hash IS NOT NULL AS has_pwd FROM users"
rm -f "$MYCNF"
