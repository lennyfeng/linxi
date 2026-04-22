#!/bin/bash
DB="mysql -u linxi_app -pLinxi@sql internal_platform -N"

echo "=== Row counts: App tables vs Lingxing tables ==="
for pair in "purchase_orders:lx_purchase_orders" "payment_requests:lx_payment_requests" "delivery_orders:lx_delivery_orders" "invoice_records:lx_invoices"; do
  APP=$(echo $pair | cut -d: -f1)
  LX=$(echo $pair | cut -d: -f2)
  APP_CNT=$($DB -e "SELECT COUNT(*) FROM $APP" 2>/dev/null || echo "N/A")
  LX_CNT=$($DB -e "SELECT COUNT(*) FROM $LX" 2>/dev/null || echo "N/A")
  echo "  $APP: $APP_CNT    |   $LX: $LX_CNT"
done

echo ""
echo "=== lx_purchase_orders sample (first 3) ==="
$DB -e "SELECT id, lx_po_id, po_number, supplier_id, status, total_amount, order_date FROM lx_purchase_orders LIMIT 3" 2>/dev/null

echo ""
echo "=== lx_suppliers sample (first 5) ==="
$DB -e "SELECT id, lx_supplier_id, name, contact FROM lx_suppliers LIMIT 5" 2>/dev/null

echo ""
echo "=== lx_purchase_orders joined with suppliers ==="
$DB -e "SELECT po.id, po.po_number, s.name as supplier_name, po.total_amount, po.status, po.order_date FROM lx_purchase_orders po LEFT JOIN lx_suppliers s ON po.supplier_id = s.id LIMIT 3" 2>/dev/null

echo ""
echo "=== DESCRIBE purchase_orders ==="
$DB -e "DESCRIBE purchase_orders" 2>/dev/null

echo ""
echo "=== DESCRIBE payment_requests ==="
$DB -e "DESCRIBE payment_requests" 2>/dev/null

echo ""
echo "=== DESCRIBE delivery_orders ==="
$DB -e "DESCRIBE delivery_orders" 2>/dev/null

echo ""
echo "=== DESCRIBE invoice_records ==="
$DB -e "DESCRIBE invoice_records" 2>/dev/null

echo ""
echo "=== transaction_attachments table? ==="
$DB -e "SHOW TABLES LIKE '%attach%'" 2>/dev/null
$DB -e "DESCRIBE transaction_attachments" 2>/dev/null || echo "table not found"

echo ""
echo "=== transaction form - check which fields exist ==="
$DB -e "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='transactions' AND TABLE_SCHEMA='internal_platform' ORDER BY ORDINAL_POSITION" 2>/dev/null
