/**
 * HTTP request logging middleware
 */

const { createLogger } = require('../logger');

const logger = createLogger('http');

/**
 * Generate a unique request ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware to log incoming requests and responses
 */
function requestLogger(options = {}) {
    const {
        logBody = false,
        excludePaths = ['/health', '/metrics'],
        sensitiveFields = ['password', 'token', 'authorization']
    } = options;

    return (req, res, next) => {
        // Skip logging for excluded paths
        if (excludePaths.includes(req.path)) {
            return next();
        }

        // Attach request ID
        req.requestId = req.headers['x-request-id'] || generateRequestId();
        res.set('X-Request-Id', req.requestId);

        const startTime = Date.now();

        // Log request
        const requestLog = {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        if (logBody && req.body) {
            requestLog.body = sanitizeBody(req.body, sensitiveFields);
        }

        logger.info('Incoming request', requestLog);

        // Capture response
        const originalSend = res.send;
        res.send = function(body) {
            const duration = Date.now() - startTime;

            logger.info('Response sent', {
                requestId: req.requestId,
                statusCode: res.statusCode,
                duration: `${duration}ms`
            });

            return originalSend.call(this, body);
        };

        next();
    };
}

/**
 * Remove sensitive fields from logged body
 */
function sanitizeBody(body, sensitiveFields) {
    if (typeof body !== 'object' || body === null) {
        return body;
    }

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Simple request timing middleware
 */
function requestTimer(req, res, next) {
    req.startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        res.set('X-Response-Time', `${duration}ms`);
    });

    next();
}

module.exports = {
    requestLogger,
    requestTimer,
    generateRequestId
};
