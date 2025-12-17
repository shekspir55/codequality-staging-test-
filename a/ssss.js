const jwt = require('jsonwebtoken');

// FIXME: Hardcoded fallback secret is a security risk
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}


function hashPassword(password) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10; // TODO: Increase to 12 for production
    return bcrypt.hashSync(password, saltRounds);
}

function verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    // TODO: Switch to async version to avoid blocking
    return bcrypt.compareSync(password, hash);
}


module.exports = {
    authenticateToken,
    generateToken,
    hashPassword,
    verifyPassword
};
