#!/bin/bash
echo "=== Trying admin via TCP ==="
mysql -u admin -h 127.0.0.1 --protocol=tcp -pLinxi@sql -e "SELECT user(), current_user()" 2>&1
echo "=== Trying admin via socket ==="
mysql -u admin -pLinxi@sql -e "SELECT user(), current_user()" 2>&1
echo "=== Trying admin with no password ==="
mysql -u admin -e "SELECT user(), current_user()" 2>&1
echo "=== Listing MySQL users via sql OS user ==="
mysql -e "SELECT user, host, plugin FROM mysql.user" 2>&1
echo "=== Done ==="
