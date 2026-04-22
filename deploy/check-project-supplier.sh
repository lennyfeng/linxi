#!/bin/bash
DB="mysql -u linxi_app -pLinxi@sql internal_platform -N"

echo "=== Distinct project_name values ==="
$DB -e "SELECT DISTINCT project_name FROM transactions WHERE project_name IS NOT NULL AND project_name <> '' LIMIT 20"

echo ""
echo "=== Distinct counterparty values ==="
$DB -e "SELECT DISTINCT counterparty FROM transactions WHERE counterparty IS NOT NULL AND counterparty <> '' LIMIT 20"

echo ""
echo "=== lx_suppliers count ==="
$DB -e "SELECT COUNT(*) FROM lx_suppliers"

echo ""
echo "=== lx_suppliers sample ==="
$DB -e "SELECT id, lx_supplier_id, name, contact FROM lx_suppliers LIMIT 5"

echo ""
echo "=== projects table ==="
$DB -e "SELECT COUNT(*) FROM projects"

echo ""
echo "=== accounts table schema ==="
$DB -e "SHOW COLUMNS FROM accounts" 2>/dev/null || echo "table not found"
