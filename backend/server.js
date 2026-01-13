// backend/server.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database pool
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Test database connection
async function testConnection() {
    try {
        const connection = await dbPool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. Please login first.' 
        });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// ========== AUTH ROUTES ==========

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt for:', username);
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username dan password wajib diisi'
            });
        }
        
        // Find user in database
        const [users] = await dbPool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        const user = users[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                name: user.full_name,
                email: user.email,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({
            success: true,
            message: 'Login berhasil',
            user: {
                id: user.id,
                username: user.username,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logout berhasil'
    });
});

// Check auth status
app.get('/api/auth/check', authenticateToken, (req, res) => {
    res.json({
        success: true,
        authenticated: true,
        user: req.user
    });
});

// ========== SERVICES CRUD ROUTES ==========

// Get all services (public)
app.get('/api/services', async (req, res) => {
    try {
        const [services] = await dbPool.query(
            'SELECT * FROM services ORDER BY created_at DESC'
        );
        
        res.json({
            success: true,
            data: services
        });
        
    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data layanan'
        });
    }
});

// Get single service (public)
app.get('/api/services/:id', async (req, res) => {
    try {
        const [services] = await dbPool.query(
            'SELECT * FROM services WHERE id = ?',
            [req.params.id]
        );
        
        if (services.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan'
            });
        }
        
        res.json({
            success: true,
            data: services[0]
        });
        
    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data layanan'
        });
    }
});

// Create service (admin only)
app.post('/api/services', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Hanya admin yang dapat menambah layanan'
            });
        }
        
        const { name, category, description, price, duration_days, is_available } = req.body;
        
        // Validate required fields
        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Nama, kategori, dan harga wajib diisi'
            });
        }
        
        const [result] = await dbPool.query(
            `INSERT INTO services 
            (name, category, description, price, duration_days, is_available) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name, 
                category, 
                description || '', 
                parseFloat(price) || 0, 
                parseInt(duration_days) || 1, 
                is_available !== undefined ? is_available : true
            ]
        );
        
        const [newService] = await dbPool.query(
            'SELECT * FROM services WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Layanan berhasil ditambahkan',
            data: newService[0]
        });
        
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menambahkan layanan'
        });
    }
});

// Update service (admin only)
app.put('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Hanya admin yang dapat mengupdate layanan'
            });
        }
        
        const { name, category, description, price, duration_days, is_available } = req.body;
        
        const [result] = await dbPool.query(
            `UPDATE services SET 
                name = ?, 
                category = ?, 
                description = ?, 
                price = ?, 
                duration_days = ?, 
                is_available = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?`,
            [
                name, 
                category, 
                description || '', 
                parseFloat(price) || 0, 
                parseInt(duration_days) || 1, 
                is_available !== undefined ? is_available : true,
                req.params.id
            ]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan'
            });
        }
        
        const [updatedService] = await dbPool.query(
            'SELECT * FROM services WHERE id = ?',
            [req.params.id]
        );
        
        res.json({
            success: true,
            message: 'Layanan berhasil diupdate',
            data: updatedService[0]
        });
        
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengupdate layanan'
        });
    }
});

// Delete service (admin only)
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Hanya admin yang dapat menghapus layanan'
            });
        }
        
        const [result] = await dbPool.query(
            'DELETE FROM services WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Layanan tidak ditemukan'
            });
        }
        
        res.json({
            success: true,
            message: 'Layanan berhasil dihapus'
        });
        
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal menghapus layanan'
        });
    }
});

// ========== DASHBOARD STATS ==========
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [servicesCount] = await dbPool.query(
            'SELECT COUNT(*) as count FROM services'
        );
        
        const [availableServices] = await dbPool.query(
            'SELECT COUNT(*) as count FROM services WHERE is_available = true'
        );
        
        const [totalValue] = await dbPool.query(
            'SELECT SUM(price) as total FROM services'
        );
        
        res.json({
            success: true,
            data: {
                total_services: servicesCount[0].count,
                available_services: availableServices[0].count,
                total_value: totalValue[0].total || 0
            }
        });
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil statistik dashboard'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint tidak ditemukan'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API Documentation:`);
    console.log(`   • POST   /api/auth/login     - Login user`);
    console.log(`   • POST   /api/auth/logout    - Logout user`);
    console.log(`   • GET    /api/auth/check     - Check auth status`);
    console.log(`   • GET    /api/services       - Get all services`);
    console.log(`   • POST   /api/services       - Create service (admin)`);
    console.log(`   • PUT    /api/services/:id   - Update service (admin)`);
    console.log(`   • DELETE /api/services/:id   - Delete service (admin)`);
    console.log(`   • GET    /api/dashboard/stats - Dashboard statistics`);
    console.log(`\n🔗 Frontend URL: ${process.env.CORS_ORIGIN}`);
    
    // Test database connection
    await testConnection();
});