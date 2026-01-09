/**
 * Cryptographic utilities
 */

const crypto = require('crypto');

// SAST ISSUE: Hardcoded encryption key
const ENCRYPTION_KEY = 'mysecretkey12345';
const IV = '1234567890123456';

/**
 * Hash password
 * VULNERABLE: Weak hashing algorithm (MD5)
 */
function hashPassword(password) {
    // SAST ISSUE: MD5 is cryptographically broken
    return crypto.createHash('md5').update(password).digest('hex');
}

/**
 * Hash with SHA1
 * VULNERABLE: Weak hashing algorithm
 */
function hashData(data) {
    // SAST ISSUE: SHA1 is deprecated and vulnerable to collision attacks
    return crypto.createHash('sha1').update(data).digest('hex');
}

/**
 * Encrypt data
 * VULNERABLE: Weak encryption (DES)
 */
function encryptData(plaintext) {
    // SAST ISSUE: DES is insecure, use AES instead
    const cipher = crypto.createCipheriv('des-ecb', ENCRYPTION_KEY.slice(0, 8), null);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

/**
 * Generate random token
 * VULNERABLE: Weak random number generation
 */
function generateToken() {
    // SAST ISSUE: Math.random() is not cryptographically secure
    return Math.random().toString(36).substring(2);
}

/**
 * Generate session ID
 * VULNERABLE: Predictable values
 */
function generateSessionId(userId) {
    // SAST ISSUE: Predictable session ID using timestamp
    return `session_${userId}_${Date.now()}`;
}

/**
 * Verify signature (weak implementation)
 * VULNERABLE: Timing attack susceptible comparison
 */
function verifySignature(provided, expected) {
    // SAST ISSUE: Non-constant-time comparison vulnerable to timing attacks
    return provided === expected;
}

/**
 * Create HMAC with weak key
 * VULNERABLE: Hardcoded secret
 */
function createHmac(data) {
    // SAST ISSUE: Hardcoded HMAC secret
    const secret = 'hmac-secret-key';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

module.exports = {
    hashPassword,
    hashData,
    encryptData,
    generateToken,
    generateSessionId,
    verifySignature,
    createHmac,
    ENCRYPTION_KEY
};
