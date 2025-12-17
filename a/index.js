/**
 * Application entry point
 */

const express = require('express');
const { config, validateConfig } = require('./config');
const authRoutes = require('./vauthRoutes');
const { errorHandler, notFoundHandler } = require('./errorHandler');
const { requestLogger, requestTimer } = require('./middleware/requestLogger');
const { apiLimiter } = require('./rateLimiter');
const { createLogger } = require('./logger');

const logger = createLogger('app');

// Validate configuration
try {
    validateConfig();
} catch (err) {
    console.error('Configuration validation failed:', err.message);
    process.exit(1);
}

const app = express();

// Basic middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging and timing
app.use(requestTimer);
app.use(requestLogger({
    logBody: config.nodeEnv === 'development',
    excludePaths: ['/health', '/favicon.ico']
}));

// Health check endpoint (before rate limiter)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: config.apiVersion
    });
});

// Readiness probe
app.get('/ready', (req, res) => {
    res.json({ ready: true });
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter.middleware());

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`, {
        environment: config.nodeEnv,
        nodeVersion: process.version
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

module.exports = app;
