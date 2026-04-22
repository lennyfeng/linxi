-- Migration 011: extend ledger_counterparties with contact fields
-- Date: 2026-04-22

ALTER TABLE ledger_counterparties
  ADD COLUMN contact VARCHAR(200) DEFAULT NULL AFTER description,
  ADD COLUMN phone VARCHAR(50) DEFAULT NULL AFTER contact,
  ADD COLUMN remark VARCHAR(500) DEFAULT NULL AFTER phone;
