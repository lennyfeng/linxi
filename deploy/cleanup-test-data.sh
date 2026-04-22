#!/bin/bash
mysql -u linxi_app -pLinxi@sql internal_platform <<'EOF'
DELETE FROM users WHERE username='test_fin';
DELETE FROM roles WHERE name='Finance Manager' OR name='Finance Manager Updated';
DELETE FROM departments WHERE name LIKE 'Finance%';
DELETE FROM accounts WHERE name IN ('Functional Test Bank','Functional Test Bank Updated','Debug Test Account');
DELETE FROM categories WHERE name IN ('Office Supplies','Sales Revenue','Office Supplies & Equipment');
DELETE FROM product_dev_projects WHERE product_name LIKE 'Smart LED%';
DELETE FROM profit_calculations WHERE project_id NOT IN (SELECT id FROM product_dev_projects);
DELETE FROM supplier_quotes WHERE project_id NOT IN (SELECT id FROM product_dev_projects);
DELETE FROM sample_records WHERE project_id NOT IN (SELECT id FROM product_dev_projects);
DELETE FROM lingxing_sync_records WHERE project_id NOT IN (SELECT id FROM product_dev_projects);
DELETE FROM saved_views WHERE view_name LIKE '%My Monthly%';
SELECT 'Cleanup done' AS status;
EOF
