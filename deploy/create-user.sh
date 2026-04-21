#!/bin/bash
echo 'Linxi@sql' | sudo -S mysql -e "
CREATE USER IF NOT EXISTS 'linxi_app'@'%' IDENTIFIED BY 'Linxi@sql';
CREATE USER IF NOT EXISTS 'linxi_app'@'localhost' IDENTIFIED BY 'Linxi@sql';
GRANT ALL PRIVILEGES ON internal_platform.* TO 'linxi_app'@'%';
GRANT ALL PRIVILEGES ON internal_platform.* TO 'linxi_app'@'localhost';
CREATE DATABASE IF NOT EXISTS internal_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='linxi_app';
" 2>&1
echo "EXIT=$?"
