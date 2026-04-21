#!/bin/bash
echo "=== Old API process (3100) ==="
ps aux | grep -E "pid.*3074912|3074912" | head -5
ls -la /proc/3074912/cwd 2>/dev/null
cat /proc/3074912/cmdline 2>/dev/null | tr '\0' ' '
echo ""

echo "=== Old Web process (3200) ==="
ps aux | grep -E "pid.*3089719|3089719" | head -5
ls -la /proc/3089719/cwd 2>/dev/null
cat /proc/3089719/cmdline 2>/dev/null | tr '\0' ' '
echo ""

echo "=== PM2 or systemd? ==="
which pm2 2>/dev/null && pm2 list 2>/dev/null
systemctl list-units --type=service | grep -i internal 2>/dev/null
echo ""

echo "=== Find old project dirs ==="
find /home/sql -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null
