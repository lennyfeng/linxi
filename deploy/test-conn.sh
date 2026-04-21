#!/bin/bash
MYCNF=/tmp/.test-conn.cnf
cat > "$MYCNF" <<'EOF'
[client]
user=admin
password=Linxi#sql123
host=127.0.0.1
port=3306
protocol=tcp
EOF
chmod 600 "$MYCNF"
echo "=== cnf content ==="
cat "$MYCNF"
echo "=== trying connect ==="
mysql --defaults-extra-file="$MYCNF" --protocol=tcp -e "SELECT 1" 2>&1
echo "exit=$?"
echo "=== trying without cnf ==="
mysql -u admin -h 127.0.0.1 --protocol=tcp -p'Linxi#sql123' -e "SELECT 1" 2>&1
echo "exit=$?"
rm -f "$MYCNF"
