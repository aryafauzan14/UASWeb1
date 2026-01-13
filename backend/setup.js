// backend/setup.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setupDatabase() {
    try {
        // Create connection without database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306
        });
        
        console.log('✅ Connected to MySQL server');
        
        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`✅ Database '${process.env.DB_NAME}' created or already exists`);
        
        // Use database
        await connection.query(`USE ${process.env.DB_NAME}`);
        console.log(`✅ Using database '${process.env.DB_NAME}'`);
        
        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                email VARCHAR(100),
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');
        
        // Create services table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                category ENUM('motor', 'bor', 'sipil', 'izin') NOT NULL,
                description TEXT,
                price DECIMAL(10,2),
                duration_days INT,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Services table created');
        
        // Hash password for admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Insert admin user
        await connection.query(`
            INSERT IGNORE INTO users (username, password, full_name, email, role) 
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', hashedPassword, 'Arya Fauzan', 'arya@email.com', 'admin']);
        console.log('✅ Admin user created (username: admin, password: admin123)');
        
        // Insert sample services
        await connection.query(`
            INSERT IGNORE INTO services (name, category, description, price, duration_days) VALUES
            ('Servis Motor Rutin', 'motor', 'Servis lengkap motor termasuk ganti oli, filter, tune up', 150000, 1),
            ('Bor Sumur Dalam 50m', 'bor', 'Pengeboran sumur dalam hingga 50 meter dengan garansi', 7500000, 3),
            ('Pembuatan IMB Rumah', 'izin', 'Pengurusan IMB untuk rumah tinggal 2 lantai', 2500000, 7),
            ('Renovasi Rumah', 'sipil', 'Renovasi rumah lengkap dengan desain modern', 50000000, 30)
        `);
        console.log('✅ Sample services inserted');
        
        await connection.end();
        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📋 Database Information:');
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   Admin User: admin / admin123`);
        console.log(`   Total Services: 4 sample services`);
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
setupDatabase();