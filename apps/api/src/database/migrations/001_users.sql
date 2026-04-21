-- 001_users.sql: Users, Departments, Roles, Permissions

CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `parent_id` INT UNSIGNED NULL DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(500) NULL,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` INT UNSIGNED NOT NULL,
  `permission_key` VARCHAR(200) NOT NULL COMMENT 'e.g. ledger.transaction.create, users.manage',
  `permission_type` ENUM('menu','operation','data','field') NOT NULL DEFAULT 'operation',
  PRIMARY KEY (`id`),
  INDEX `idx_role` (`role_id`),
  UNIQUE KEY `uk_role_perm` (`role_id`, `permission_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(200) NOT NULL,
  `display_name` VARCHAR(100) NULL,
  `email` VARCHAR(200) NULL,
  `phone` VARCHAR(30) NULL,
  `avatar` VARCHAR(500) NULL,
  `department_id` INT UNSIGNED NULL,
  `lingxing_uid` VARCHAR(100) NULL COMMENT 'Linked Lingxing user id',
  `status` ENUM('active','disabled') NOT NULL DEFAULT 'active',
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  INDEX `idx_department` (`department_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` INT UNSIGNED NOT NULL,
  `role_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`),
  INDEX `idx_role` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default admin role and admin user (password: admin123)
INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `is_system`) VALUES
  (1, 'Super Admin', 'Full system access', 1);

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_key`, `permission_type`) VALUES
  (1, '*', 'operation');
