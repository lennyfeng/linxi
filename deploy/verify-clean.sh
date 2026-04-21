#!/bin/bash
echo "=== Port check ==="
ss -tlnp | grep -E "310[01]|320[01]"

echo "=== Old dirs? ==="
ls -d /home/sql/internal-platform-api 2>/dev/null && echo "OLD API EXISTS" || echo "Old API: removed"
ls -d /home/sql/internal-platform-web 2>/dev/null && echo "OLD WEB EXISTS" || echo "Old Web: removed"

echo "=== New project ==="
ls -d /home/sql/internal-platform 2>/dev/null && echo "New project: exists"
docker ps --format "{{.Names}} {{.Ports}}" 2>/dev/null
