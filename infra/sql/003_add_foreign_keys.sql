-- Internal Platform migration 003
-- 为已存在的 v1 库补充关键索引与外键约束
-- 适用场景：已执行 002_schema_v1.sql 的历史库，需要增量升级到当前关系约束版本

USE internal_platform;

-- =========================
-- 1. 用户权限模块
-- =========================

ALTER TABLE users
  ADD KEY idx_users_department_id (department_id),
  ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE user_roles
  ADD KEY idx_user_roles_user_id (user_id),
  ADD KEY idx_user_roles_role_id (role_id),
  ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE role_permissions
  ADD KEY idx_role_permissions_role_id (role_id),
  ADD KEY idx_role_permissions_permission_id (permission_id),
  ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE RESTRICT;

-- =========================
-- 2. 记账模块
-- =========================

ALTER TABLE transactions
  ADD KEY idx_transactions_account_id (account_id),
  ADD KEY idx_transactions_category_id (category_id),
  ADD CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE transaction_attachments
  ADD KEY idx_transaction_attachments_transaction_id (transaction_id),
  ADD CONSTRAINT fk_transaction_attachments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE reimbursement_transaction_relations
  ADD KEY idx_reimbursement_transaction_batch_id (reimbursement_batch_id),
  ADD KEY idx_reimbursement_transaction_transaction_id (transaction_id),
  ADD CONSTRAINT fk_reimbursement_transaction_batch FOREIGN KEY (reimbursement_batch_id) REFERENCES reimbursement_batches(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_reimbursement_transaction_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE external_transactions
  ADD KEY idx_external_transactions_import_batch_id (import_batch_id),
  ADD CONSTRAINT fk_external_transactions_import_batch FOREIGN KEY (import_batch_id) REFERENCES external_import_batches(id) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE transaction_external_matches
  ADD KEY idx_match_external_transaction_id (external_transaction_id),
  ADD CONSTRAINT fk_transaction_external_matches_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_transaction_external_matches_external FOREIGN KEY (external_transaction_id) REFERENCES external_transactions(id) ON DELETE CASCADE ON UPDATE RESTRICT;

-- =========================
-- 3. 勾稽模块
-- =========================

ALTER TABLE invoice_purchase_relations
  ADD KEY idx_invoice_purchase_relations_invoice_id (invoice_id),
  ADD KEY idx_invoice_purchase_relations_purchase_order_id (purchase_order_id),
  ADD CONSTRAINT fk_invoice_purchase_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_invoice_purchase_relations_purchase FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE invoice_payment_request_relations
  ADD KEY idx_invoice_payment_request_relations_invoice_id (invoice_id),
  ADD KEY idx_invoice_payment_request_relations_payment_id (payment_request_id),
  ADD CONSTRAINT fk_invoice_payment_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_invoice_payment_relations_payment FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE invoice_delivery_relations
  ADD KEY idx_invoice_delivery_relations_invoice_id (invoice_id),
  ADD KEY idx_invoice_delivery_relations_delivery_id (delivery_order_id),
  ADD CONSTRAINT fk_invoice_delivery_relations_invoice FOREIGN KEY (invoice_id) REFERENCES invoice_records(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT fk_invoice_delivery_relations_delivery FOREIGN KEY (delivery_order_id) REFERENCES delivery_orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- =========================
-- 4. 新品开发模块
-- =========================

ALTER TABLE supplier_quotes
  ADD KEY idx_supplier_quotes_project_id (project_id),
  ADD CONSTRAINT fk_supplier_quotes_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE profit_calculations
  ADD KEY idx_profit_calculations_project_id (project_id),
  ADD CONSTRAINT fk_profit_calculations_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE sample_records
  ADD KEY idx_sample_records_project_id (project_id),
  ADD CONSTRAINT fk_sample_records_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE lingxing_sync_records
  ADD KEY idx_lingxing_sync_records_project_id (project_id),
  ADD CONSTRAINT fk_lingxing_sync_records_project FOREIGN KEY (project_id) REFERENCES product_dev_projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
