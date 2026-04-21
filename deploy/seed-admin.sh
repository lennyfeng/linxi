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

# Write SQL to temp file to avoid bash escaping issues with bcrypt $ signs
cat > /tmp/seed-admin.sql <<'EOSQL'
INSERT INTO users (username, password_hash, display_name, email, status, must_change_password)
VALUES ('admin', '$2a$10$rKN3RPCyJnOXaKCZrwRB2uXlHzQbqEsLDcK5EKj7rJ7y4PJoHFxBG', 'Admin', 'admin@linxi.com', 'active', 0)
ON DUPLICATE KEY UPDATE password_hash='$2a$10$rKN3RPCyJnOXaKCZrwRB2uXlHzQbqEsLDcK5EKj7rJ7y4PJoHFxBG';

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);

SELECT id, username, display_name, status FROM users;
EOSQL

mysql --defaults-extra-file="$MYCNF" --protocol=tcp internal_platform < /tmp/seed-admin.sql

rm -f "$MYCNF" /tmp/seed-admin.sql
echo "=== Admin user seeded ==="
