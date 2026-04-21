-- Internal Platform migration precheck 004
-- 外键迁移前数据预检查：只查询潜在脏数据，不做任何修改
-- 适用场景：在执行 003_add_foreign_keys.sql 前，先确认历史数据不存在悬挂引用

USE internal_platform;

-- =========================
-- 1. 用户权限模块
-- =========================

SELECT 'users.department_id -> departments.id' AS check_name, u.id AS row_id, u.department_id AS missing_ref_id
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE u.department_id IS NOT NULL AND d.id IS NULL;

SELECT 'user_roles.user_id -> users.id' AS check_name, ur.id AS row_id, ur.user_id AS missing_ref_id
FROM user_roles ur
LEFT JOIN users u ON u.id = ur.user_id
WHERE u.id IS NULL;

SELECT 'user_roles.role_id -> roles.id' AS check_name, ur.id AS row_id, ur.role_id AS missing_ref_id
FROM user_roles ur
LEFT JOIN roles r ON r.id = ur.role_id
WHERE r.id IS NULL;

SELECT 'role_permissions.role_id -> roles.id' AS check_name, rp.id AS row_id, rp.role_id AS missing_ref_id
FROM role_permissions rp
LEFT JOIN roles r ON r.id = rp.role_id
WHERE r.id IS NULL;

SELECT 'role_permissions.permission_id -> permissions.id' AS check_name, rp.id AS row_id, rp.permission_id AS missing_ref_id
FROM role_permissions rp
LEFT JOIN permissions p ON p.id = rp.permission_id
WHERE p.id IS NULL;

-- =========================
-- 2. 记账模块
-- =========================

SELECT 'transactions.account_id -> accounts.id' AS check_name, t.id AS row_id, t.account_id AS missing_ref_id
FROM transactions t
LEFT JOIN accounts a ON a.id = t.account_id
WHERE t.account_id IS NOT NULL AND a.id IS NULL;

SELECT 'transactions.category_id -> categories.id' AS check_name, t.id AS row_id, t.category_id AS missing_ref_id
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.category_id IS NOT NULL AND c.id IS NULL;

SELECT 'transaction_attachments.transaction_id -> transactions.id' AS check_name, ta.id AS row_id, ta.transaction_id AS missing_ref_id
FROM transaction_attachments ta
LEFT JOIN transactions t ON t.id = ta.transaction_id
WHERE t.id IS NULL;

SELECT 'reimbursement_transaction_relations.reimbursement_batch_id -> reimbursement_batches.id' AS check_name, rtr.id AS row_id, rtr.reimbursement_batch_id AS missing_ref_id
FROM reimbursement_transaction_relations rtr
LEFT JOIN reimbursement_batches rb ON rb.id = rtr.reimbursement_batch_id
WHERE rb.id IS NULL;

SELECT 'reimbursement_transaction_relations.transaction_id -> transactions.id' AS check_name, rtr.id AS row_id, rtr.transaction_id AS missing_ref_id
FROM reimbursement_transaction_relations rtr
LEFT JOIN transactions t ON t.id = rtr.transaction_id
WHERE t.id IS NULL;

SELECT 'external_transactions.import_batch_id -> external_import_batches.id' AS check_name, et.id AS row_id, et.import_batch_id AS missing_ref_id
FROM external_transactions et
LEFT JOIN external_import_batches eib ON eib.id = et.import_batch_id
WHERE eib.id IS NULL;

SELECT 'transaction_external_matches.transaction_id -> transactions.id' AS check_name, tem.id AS row_id, tem.transaction_id AS missing_ref_id
FROM transaction_external_matches tem
LEFT JOIN transactions t ON t.id = tem.transaction_id
WHERE t.id IS NULL;

SELECT 'transaction_external_matches.external_transaction_id -> external_transactions.id' AS check_name, tem.id AS row_id, tem.external_transaction_id AS missing_ref_id
FROM transaction_external_matches tem
LEFT JOIN external_transactions et ON et.id = tem.external_transaction_id
WHERE et.id IS NULL;

-- =========================
-- 3. 勾稽模块
-- =========================

SELECT 'invoice_purchase_relations.invoice_id -> invoice_records.id' AS check_name, ipr.id AS row_id, ipr.invoice_id AS missing_ref_id
FROM invoice_purchase_relations ipr
LEFT JOIN invoice_records ir ON ir.id = ipr.invoice_id
WHERE ir.id IS NULL;

SELECT 'invoice_purchase_relations.purchase_order_id -> purchase_orders.id' AS check_name, ipr.id AS row_id, ipr.purchase_order_id AS missing_ref_id
FROM invoice_purchase_relations ipr
LEFT JOIN purchase_orders po ON po.id = ipr.purchase_order_id
WHERE po.id IS NULL;

SELECT 'invoice_payment_request_relations.invoice_id -> invoice_records.id' AS check_name, iprr.id AS row_id, iprr.invoice_id AS missing_ref_id
FROM invoice_payment_request_relations iprr
LEFT JOIN invoice_records ir ON ir.id = iprr.invoice_id
WHERE ir.id IS NULL;

SELECT 'invoice_payment_request_relations.payment_request_id -> payment_requests.id' AS check_name, iprr.id AS row_id, iprr.payment_request_id AS missing_ref_id
FROM invoice_payment_request_relations iprr
LEFT JOIN payment_requests pr ON pr.id = iprr.payment_request_id
WHERE pr.id IS NULL;

SELECT 'invoice_delivery_relations.invoice_id -> invoice_records.id' AS check_name, idr.id AS row_id, idr.invoice_id AS missing_ref_id
FROM invoice_delivery_relations idr
LEFT JOIN invoice_records ir ON ir.id = idr.invoice_id
WHERE ir.id IS NULL;

SELECT 'invoice_delivery_relations.delivery_order_id -> delivery_orders.id' AS check_name, idr.id AS row_id, idr.delivery_order_id AS missing_ref_id
FROM invoice_delivery_relations idr
LEFT JOIN delivery_orders doo ON doo.id = idr.delivery_order_id
WHERE doo.id IS NULL;

-- =========================
-- 4. 新品开发模块
-- =========================

SELECT 'supplier_quotes.project_id -> product_dev_projects.id' AS check_name, sq.id AS row_id, sq.project_id AS missing_ref_id
FROM supplier_quotes sq
LEFT JOIN product_dev_projects pdp ON pdp.id = sq.project_id
WHERE pdp.id IS NULL;

SELECT 'profit_calculations.project_id -> product_dev_projects.id' AS check_name, pc.id AS row_id, pc.project_id AS missing_ref_id
FROM profit_calculations pc
LEFT JOIN product_dev_projects pdp ON pdp.id = pc.project_id
WHERE pdp.id IS NULL;

SELECT 'sample_records.project_id -> product_dev_projects.id' AS check_name, sr.id AS row_id, sr.project_id AS missing_ref_id
FROM sample_records sr
LEFT JOIN product_dev_projects pdp ON pdp.id = sr.project_id
WHERE pdp.id IS NULL;

SELECT 'lingxing_sync_records.project_id -> product_dev_projects.id' AS check_name, lsr.id AS row_id, lsr.project_id AS missing_ref_id
FROM lingxing_sync_records lsr
LEFT JOIN product_dev_projects pdp ON pdp.id = lsr.project_id
WHERE pdp.id IS NULL;
