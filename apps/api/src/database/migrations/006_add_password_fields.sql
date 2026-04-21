-- 006_add_password_fields.sql: Add password_hash, must_change_password, avatar to users table

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `password_hash` VARCHAR(200) NULL AFTER `username`,
  ADD COLUMN IF NOT EXISTS `must_change_password` TINYINT(1) NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN IF NOT EXISTS `avatar` VARCHAR(500) NULL AFTER `mobile`;

-- Add settings table if not exists
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` JSON NOT NULL,
  `description` VARCHAR(300) NULL,
  `is_secret` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_by` INT UNSIGNED NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Set default admin password (admin123 bcrypt hash)
-- UPDATE users SET password_hash = '$2a$10$rKN3RPCyJnOXaKCZrwRB2uXlHzQbqEsLDcK5EKj7rJ7y4PJoHFxBG' WHERE username = 'admin' AND password_hash IS NULL;
