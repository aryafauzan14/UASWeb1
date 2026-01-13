const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak. Silakan login terlebih dahulu.' 
        });
    }
    
    try {
        const verified = jwt.verify(token, 'your-secret-key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: 'Token tidak valid' 
        });
    }
};

module.exports = { verifyToken };