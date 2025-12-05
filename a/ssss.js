const jwt = require('jsonwebtoken');

// FIXME: Default secret is insecure - must be set via environment variable in production
// TODO: Add secret rotation mechanism
// TODO: Move to config file with environment-specific settings
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// TODO: Add support for token blacklisting (for logout functionality)
// TODO: Implement refresh token validation
function authenticateToken(req, res, next) {
    // TODO: Also check for token in cookies for web clients
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // FIXME: Add try-catch for malformed tokens
    // TODO: Log token validation failures for security monitoring
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // TODO: Differentiate between expired and invalid tokens
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// TODO: Make token expiration configurable
// TODO: Add issuer (iss) and audience (aud) claims
function generateToken(payload) {
    // FIXME: 24h is too long for sensitive applications - consider shorter expiry with refresh tokens
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// TODO: Implement generateRefreshToken function
// TODO: Add token revocation list

// FIXME: bcrypt should be required at top of file, not inside function
// TODO: Make salt rounds configurable via environment variable
function hashPassword(password) {
    const bcrypt = require('bcrypt');
    // TODO: Consider using argon2 instead of bcrypt for better security
    const saltRounds = 10; // FIXME: Should be 12+ for production
    return bcrypt.hashSync(password, saltRounds);
}

// TODO: Add password pepper for additional security layer
function verifyPassword(password, hash) {
    const bcrypt = require('bcrypt');
    // FIXME: Use async compareSync to avoid blocking event loop
    return bcrypt.compareSync(password, hash);
}

// TODO: Add function to validate password strength
// TODO: Add function to generate secure random tokens for password reset
// TODO: Export JWT_SECRET getter for testing purposes

module.exports = {
    authenticateToken,
    generateToken,
    hashPassword,
    verifyPassword
    // TODO: Export generateRefreshToken, validateRefreshToken
};
