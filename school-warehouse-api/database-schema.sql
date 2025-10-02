-- Create database
CREATE DATABASE IF NOT EXISTS storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE storage;

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  warehouse_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id INT,
  warehouse_id INT,
  quantity INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  national_id VARCHAR(14) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL,
  warehouse_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT,
  user_id INT,
  transaction_type ENUM('issue', 'return', 'exchange_out', 'exchange_in', 'audit_adjustment', 'daily_audit') NOT NULL,
  quantity INT NOT NULL,
  recipient VARCHAR(255),
  notes TEXT,
  expected_quantity INT NULL,
  actual_quantity INT NULL,
  discrepancy INT NULL,
  egyptian_timestamp DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create daily_audits table
CREATE TABLE IF NOT EXISTS daily_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT,
  item_id INT,
  user_id INT,
  expected_quantity INT NOT NULL,
  actual_quantity INT NOT NULL,
  discrepancy INT NOT NULL,
  notes TEXT,
  audit_date DATE NOT NULL,
  egyptian_timestamp DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for better performance
CREATE INDEX idx_items_warehouse ON items(warehouse_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_categories_warehouse ON categories(warehouse_id);
CREATE INDEX idx_users_warehouse ON users(warehouse_id);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_transactions_item ON transactions(item_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(egyptian_timestamp);
CREATE INDEX idx_daily_audits_warehouse ON daily_audits(warehouse_id);
CREATE INDEX idx_daily_audits_item ON daily_audits(item_id);
CREATE INDEX idx_daily_audits_user ON daily_audits(user_id);
CREATE INDEX idx_daily_audits_date ON daily_audits(audit_date);