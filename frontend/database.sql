-- database.sql
CREATE DATABASE IF NOT EXISTS arya_teknik_db;
USE arya_teknik_db;

-- Users table for authentication
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password: admin123 (bcrypt hashed)
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMye3Z6E7Kq7q2L8ZJ4cQb1q5V5VtJ5YbW6', 'Arya Fauzan', 'arya@email.com', 'admin');

-- Services table for CRUD operations
CREATE TABLE services (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category ENUM('motor', 'bor', 'sipil', 'izin') NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration_days INT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample services
INSERT INTO services (name, category, description, price, duration_days) VALUES
('Servis Motor Rutin', 'motor', 'Servis lengkap motor termasuk ganti oli, filter, tune up', 150000, 1),
('Bor Sumur Dalam 50m', 'bor', 'Pengeboran sumur dalam hingga 50 meter dengan garansi', 7500000, 3),
('Pembuatan IMB Rumah', 'izin', 'Pengurusan IMB untuk rumah tinggal 2 lantai', 2500000, 7),
('Renovasi Rumah', 'sipil', 'Renovasi rumah lengkap dengan desain modern', 50000000, 30);