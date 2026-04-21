#!/bin/bash
MYCNF=/tmp/.test-my.cnf
cat > "$MYCNF" <<'EOF'
[client]
user=metabase
password=Linxi#sql123
host=127.0.0.1
port=3306
EOF
chmod 600 "$MYCNF"
echo "Testing metabase via 127.0.0.1..."
mysql --defaults-extra-file="$MYCNF" -e "SELECT user() AS connected_as" 2>&1
RET=$?
rm -f "$MYCNF"
echo "Exit: $RET"
