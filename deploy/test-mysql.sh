#!/bin/bash
MYCNF=/tmp/.test-my.cnf
cat > "$MYCNF" <<'EOF'
[client]
user=metabase
password=Linxi#sql123
EOF
chmod 600 "$MYCNF"
echo "Testing metabase login..."
mysql --defaults-extra-file="$MYCNF" -e "SELECT 1 AS ok" 2>&1
RET=$?
rm -f "$MYCNF"
if [ $RET -ne 0 ]; then
  echo "metabase login FAILED (exit $RET)"
  echo "Trying root..."
  mysql -u root -e "SELECT user, host FROM mysql.user WHERE user='metabase'" 2>&1
fi
exit $RET
