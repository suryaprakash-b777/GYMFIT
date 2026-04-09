-- ═══════════════════════════════════════
--  GymFit  ·  schema.sql
-- ═══════════════════════════════════════
 
CREATE DATABASE IF NOT EXISTS gymfit_db;
USE gymfit_db;
 
-- ── ADMINS ────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  email      VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
-- default admin (password: admin123)
INSERT IGNORE INTO admins (username, password, email) VALUES
('admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin@gymfit.com');
 
-- ── MEMBERS ───────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  phone      VARCHAR(20),
  age        INT,
  plan       ENUM('basic','standard','premium') DEFAULT 'basic',
  paid       BOOLEAN DEFAULT FALSE,
  joined     DATE DEFAULT (CURRENT_DATE),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
 
-- ── TRANSACTIONS ──────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  member_id   INT,
  member_name VARCHAR(100),
  plan        VARCHAR(50),
  amount      DECIMAL(10,2),
  payment_id  VARCHAR(100),
  date        DATE DEFAULT (CURRENT_DATE),
  time        TIME DEFAULT (CURRENT_TIME),
  status      ENUM('success','pending','failed') DEFAULT 'success',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);
 
-- ── SAMPLE DATA ───────────────────────
INSERT IGNORE INTO members (name, email, phone, age, plan, paid, joined) VALUES
('Arjun Sharma',  'arjun@example.com',   '9876543210', 25, 'premium',  TRUE,  '2024-01-15'),
('Priya Patel',   'priya@example.com',   '9876543211', 28, 'standard', TRUE,  '2024-02-01'),
('Rahul Verma',   'rahul@example.com',   '9876543212', 32, 'basic',    FALSE, '2024-03-10'),
('Sneha Iyer',    'sneha@example.com',   '9876543213', 24, 'premium',  TRUE,  '2024-03-20'),
('Karthik Nair',  'karthik@example.com', '9876543214', 29, 'standard', TRUE,  '2024-04-05');
 
INSERT IGNORE INTO transactions (member_id, member_name, plan, amount, payment_id) VALUES
(1, 'Arjun Sharma', 'Premium',  2999, 'RZP_SAMPLE_001'),
(2, 'Priya Patel',  'Standard', 1799, 'RZP_SAMPLE_002'),
(4, 'Sneha Iyer',   'Premium',  2999, 'RZP_SAMPLE_003'),
(5, 'Karthik Nair', 'Standard', 1799, 'RZP_SAMPLE_004');
