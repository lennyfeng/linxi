USE internal_platform;

INSERT INTO purchase_orders (order_no, supplier_name, amount, invoice_status, reminder_disabled, reminder_disabled_reason, source_updated_at)
SELECT 'PO-REG-001', '回归供应商A', 100.00, 'pending', 0, NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM purchase_orders WHERE order_no = 'PO-REG-001'
);

INSERT INTO payment_requests (request_no, supplier_name, amount, invoice_status, reminder_disabled, reminder_disabled_reason, source_updated_at)
SELECT 'PR-REG-001', '回归供应商A', 100.00, 'pending', 0, NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM payment_requests WHERE request_no = 'PR-REG-001'
);

INSERT INTO delivery_orders (order_no, supplier_name, amount, invoice_status, reminder_disabled, reminder_disabled_reason, source_updated_at)
SELECT 'DO-REG-001', '回归供应商A', 100.00, 'pending', 0, NULL, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM delivery_orders WHERE order_no = 'DO-REG-001'
);

INSERT INTO invoice_records (invoice_no, invoice_type, supplier_name, amount, invoice_date, match_status, source_updated_at)
SELECT 'INV-REG-001', 'VAT', '回归供应商A', 100.00, CURDATE(), 'pending', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM invoice_records WHERE invoice_no = 'INV-REG-001'
);
