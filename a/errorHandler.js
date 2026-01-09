/**
 * Centralized error handling middleware and utilities
 */

// Custom error classes
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

class RateLimitError extends AppError {
    constructor(retryAfter = 60) {
        super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
        this.retryAfter = retryAfter;
    }
}

class ServiceUnavailableError extends AppError {
    constructor(message = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE');
    }
}

/**
 * Express error handling middleware
 */
function errorHandler(err, req, res, next) {
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let code = err.code || 'INTERNAL_ERROR';

    // Log error details
    if (statusCode >= 500) {
        console.error('[ERROR]', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === 'production' && !err.isOperational) {
        message = 'An unexpected error occurred';
        code = 'INTERNAL_ERROR';
    }

    // Build response
    const response = {
        error: message,
        code: code
    };

    // Add field info for validation errors
    if (err.field) {
        response.field = err.field;
    }

    // Add retry info for rate limit errors
    if (err.retryAfter) {
        response.retryAfter = err.retryAfter;
        res.set('Retry-After', err.retryAfter);
    }

    res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
    next(new NotFoundError('Endpoint'));
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ServiceUnavailableError,
    errorHandler,
    asyncHandler,
    notFoundHandler
};
