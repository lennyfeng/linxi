#!/bin/bash
DB="mysql -u linxi_app -pLinxi@sql internal_platform"

echo "=== Tables related to reconciliation ==="
$DB -e "SHOW TABLES" | grep -iE 'lx_|recon|invoice|supplier|purchase|payment|delivery'

echo ""
echo "=== lx_purchase_orders ==="
$DB -e "DESCRIBE lx_purchase_orders" 2>/dev/null || echo "Table not found"

echo ""
echo "=== lx_invoices ==="
$DB -e "DESCRIBE lx_invoices" 2>/dev/null || echo "Table not found"

echo ""
echo "=== lx_payment_requests ==="
$DB -e "DESCRIBE lx_payment_requests" 2>/dev/null || echo "Table not found"

echo ""
echo "=== lx_delivery_orders ==="
$DB -e "DESCRIBE lx_delivery_orders" 2>/dev/null || echo "Table not found"

echo ""
echo "=== lx_suppliers ==="
$DB -e "DESCRIBE lx_suppliers" 2>/dev/null || echo "Table not found"

echo ""
echo "=== recon_relations ==="
$DB -e "DESCRIBE recon_relations" 2>/dev/null || echo "Table not found"

echo ""
echo "=== recon_status_snapshots ==="
$DB -e "DESCRIBE recon_status_snapshots" 2>/dev/null || echo "Table not found"

echo ""
echo "=== recon_alerts ==="
$DB -e "DESCRIBE recon_alerts" 2>/dev/null || echo "Table not found"

echo ""
echo "=== Row counts ==="
for t in lx_purchase_orders lx_invoices lx_payment_requests lx_delivery_orders lx_suppliers recon_relations; do
  CNT=$($DB -N -e "SELECT COUNT(*) FROM $t" 2>/dev/null || echo "N/A")
  echo "  $t: $CNT"
done

echo ""
echo "=== transactions table (check for project/remark/image fields) ==="
$DB -e "DESCRIBE transactions" 2>/dev/null | grep -iE 'project|remark|note|image|attachment|file|memo'
echo "(full schema:)"
$DB -e "DESCRIBE transactions" 2>/dev/null
