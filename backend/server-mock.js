// backend/server-mock.js - No database required
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow all origins for development
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// JWT Secret
const JWT_SECRET = 'arya-fauzan-teknik-mock-secret';

// Mock data in memory
let mockServices = [
    {
        id: 1,
        name: 'Servis Motor Rutin',
        category: 'motor',
        description: 'Servis lengkap motor termasuk ganti oli, filter, tune up',
        price: 150000,
        duration_days: 1,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Bor Sumur Dalam 50m',
        category: 'bor',
        description: 'Pengeboran sumur dalam hingga 50 meter dengan garansi',
        price: 7500000,
        duration_days: 3,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Pembuatan IMB Rumah',
        category: 'izin',
        description: 'Pengurusan IMB untuk rumah tinggal 2 lantai',
        price: 2500000,
        duration_days: 7,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Renovasi Rumah',
        category: 'sipil',
        description: 'Renovasi rumah lengkap dengan desain modern',
        price: 50000000,
        duration_days: 30,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Mock users
const mockUsers = [
    {
        id: 1,
        username: 'admin',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6E7Kq7q2L8ZJ4cQb1q5V5VtJ5YbW6', // admin123
        full_name: 'Arya Fauzan Permana Putra',
        email: 'aryapermana@gmail.com',
        role: 'admin'
    },
    {
        id: 2,
        username: 'user',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6E7Kq7q2L8ZJ4cQb1q5V5VtJ5YbW6', // admin123
        full_name: 'User Biasa',
        email: 'user@email.com',
        role: 'user'
    }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
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
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token.' 
        });
    }
};

// ========== PUBLIC ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Arya Fauzan Teknik API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        mode: 'MOCK (No Database)'
    });
});

// Get all services (public)
app.get('/api/services', (req, res) => {
    res.json({
        success: true,
        data: mockServices,
        count: mockServices.length
    });
});

// Get single service (public)
app.get('/api/services/:id', (req, res) => {
    const service = mockServices.find(s => s.id === parseInt(req.params.id));
    
    if (!service) {
        return res.status(404).json({
            success: false,
            message: 'Service not found'
        });
    }
    
    res.json({
        success: true,
        data: service
    });
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt:', { username });
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        const user = mockUsers.find(u => u.username === username);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // In mock version, we'll accept 'admin123' directly
        // For real bcrypt comparison: await bcrypt.compare(password, user.password)
        const isValidPassword = password === 'admin123';
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        
        // Create token
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
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({
            success: true,
            message: 'Login successful',
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
            message: 'Server error during login'
        });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logout successful'
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

// ========== PROTECTED ROUTES ==========

// Create service (admin only)
app.post('/api/services', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const { name, category, description, price, duration_days, is_available } = req.body;
        
        if (!name || !category || !price) {
            return res.status(400).json({
                success: false,
                message: 'Name, category, and price are required'
            });
        }
        
        const newService = {
            id: mockServices.length + 1,
            name,
            category,
            description: description || '',
            price: parseFloat(price),
            duration_days: parseInt(duration_days) || 1,
            is_available: is_available !== undefined ? is_available : true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        mockServices.push(newService);
        
        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: newService
        });
        
    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service'
        });
    }
});

// Update service (admin only)
app.put('/api/services/:id', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const serviceId = parseInt(req.params.id);
        const serviceIndex = mockServices.findIndex(s => s.id === serviceId);
        
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        const { name, category, description, price, duration_days, is_available } = req.body;
        
        mockServices[serviceIndex] = {
            ...mockServices[serviceIndex],
            name: name || mockServices[serviceIndex].name,
            category: category || mockServices[serviceIndex].category,
            description: description || mockServices[serviceIndex].description,
            price: price !== undefined ? parseFloat(price) : mockServices[serviceIndex].price,
            duration_days: duration_days !== undefined ? parseInt(duration_days) : mockServices[serviceIndex].duration_days,
            is_available: is_available !== undefined ? is_available : mockServices[serviceIndex].is_available,
            updated_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            message: 'Service updated successfully',
            data: mockServices[serviceIndex]
        });
        
    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating service'
        });
    }
});

// Delete service (admin only)
app.delete('/api/services/:id', authenticateToken, (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        
        const serviceId = parseInt(req.params.id);
        const serviceIndex = mockServices.findIndex(s => s.id === serviceId);
        
        if (serviceIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }
        
        const deletedService = mockServices[serviceIndex];
        mockServices = mockServices.filter(s => s.id !== serviceId);
        
        res.json({
            success: true,
            message: 'Service deleted successfully',
            data: deletedService
        });
        
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting service'
        });
    }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    try {
        const totalServices = mockServices.length;
        const availableServices = mockServices.filter(s => s.is_available).length;
        const totalValue = mockServices.reduce((sum, service) => sum + service.price, 0);
        
        res.json({
            success: true,
            data: {
                total_services: totalServices,
                available_services: availableServices,
                total_value: totalValue
            }
        });
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting dashboard stats'
        });
    }
});

// Register new user (optional)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, full_name, email } = req.body;
        
        if (!username || !password || !full_name || !email) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Check if user exists
        const userExists = mockUsers.find(u => u.username === username);
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: mockUsers.length + 1,
            username,
            password: hashedPassword,
            full_name,
            email,
            role: 'user'
        };
        
        mockUsers.push(newUser);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.full_name,
                email: newUser.email,
                role: newUser.role
            }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
});

// ========== FRONTEND HELPERS ==========

// Serve frontend files (optional)
app.use(express.static('../frontend'));

// API documentation
app.get('/api/docs', (req, res) => {
    res.json({
        name: 'Arya Fauzan Teknik API',
        version: '1.0.0',
        endpoints: [
            { method: 'GET', path: '/api/health', description: 'Health check' },
            { method: 'POST', path: '/api/auth/login', description: 'User login' },
            { method: 'POST', path: '/api/auth/logout', description: 'User logout' },
            { method: 'GET', path: '/api/auth/check', description: 'Check auth status' },
            { method: 'GET', path: '/api/services', description: 'Get all services' },
            { method: 'POST', path: '/api/services', description: 'Create service (admin)' },
            { method: 'PUT', path: '/api/services/:id', description: 'Update service (admin)' },
            { method: 'DELETE', path: '/api/services/:id', description: 'Delete service (admin)' },
            { method: 'GET', path: '/api/dashboard/stats', description: 'Dashboard statistics' }
        ]
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🚀 Arya Fauzan Teknik Mock Server is running!');
    console.log(`📍 Port: ${PORT}`);
    console.log('📌 Mode: MOCK (No database required)');
    console.log('\n🔐 Authentication:');
    console.log('   • Username: admin');
    console.log('   • Password: admin123');
    console.log('\n🌐 API Endpoints:');
    console.log(`   • Health Check: http://localhost:${PORT}/api/health`);
    console.log(`   • API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`   • Services: http://localhost:${PORT}/api/services`);
    console.log('\n📱 Frontend Integration:');
    console.log('   1. Open index.html in browser');
    console.log('   2. Login with admin/admin123');
    console.log('   3. CRUD operations will work with mock data');
    console.log('\n⚡ Note: All data is stored in memory and will reset on server restart.');
});