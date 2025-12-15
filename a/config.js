/**
 * Application configuration
 * Loads settings from environment variables with sensible defaults
 */

const config = {
    // Server settings
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // JWT settings
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    },

    // Password hashing
    bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        filePath: process.env.LOG_FILE_PATH || './logs/app.log',
        maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE, 10) || 10485760,
        maxFiles: parseInt(process.env.LOG_MAX_FILES, 10) || 5
    },

    // Database (for future use)
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        name: process.env.DB_NAME || 'auth_db',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || ''
    },

    // Cache settings
    cache: {
        ttl: parseInt(process.env.CACHE_TTL, 10) || 300000, // 5 minutes
        checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 60000
    }
};

// Validate required settings in production
function validateConfig() {
    const errors = [];

    if (config.nodeEnv === 'production') {
        if (config.jwt.secret === 'your-secret-key') {
            errors.push('JWT_SECRET must be set in production');
        }
        if (config.bcrypt.saltRounds < 12) {
            errors.push('BCRYPT_SALT_ROUNDS should be at least 12 in production');
        }
    }

    if (errors.length > 0) {
        throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }
}

module.exports = {
    config,
    validateConfig
};
