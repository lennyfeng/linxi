#!/bin/bash
echo "=== Apache sites ==="
ls /etc/apache2/sites-enabled/ 2>/dev/null
cat /etc/apache2/sites-enabled/*.conf 2>/dev/null | head -40

echo "=== Apache document root ==="
grep -r "DocumentRoot\|ProxyPass" /etc/apache2/sites-enabled/ 2>/dev/null

echo "=== What is on port 80 ==="
curl -sI http://127.0.0.1:80/ | head -10

echo "=== Nginx? ==="
which nginx 2>/dev/null && nginx -T 2>/dev/null | grep -E "server_name|listen|proxy_pass|root" | head -20
