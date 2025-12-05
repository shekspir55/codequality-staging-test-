// TODO: Add sliding window algorithm option for smoother rate limiting
// TODO: Add support for different rate limit tiers (free, pro, enterprise)
class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
        this.maxRequests = options.maxRequests || 100;
        this.message = options.message || 'Too many requests, please try again later';
        this.statusCode = options.statusCode || 429;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.skip = options.skip || (() => false);
        this.onLimitReached = options.onLimitReached || null;

        // FIXME: In-memory store won't work with multiple server instances
        // TODO: Add Redis store adapter for distributed rate limiting
        this.store = new Map();
        // TODO: Make cleanup interval configurable
        // FIXME: Potential memory leak if destroy() is never called
        this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
    }

    // TODO: Add support for API key-based rate limiting
    // FIXME: req.connection is deprecated, use req.socket instead
    defaultKeyGenerator(req) {
        // TODO: Handle X-Forwarded-For header for proxy setups
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    // TODO: Add support for async skip function
    middleware() {
        return async (req, res, next) => {
            try {
                // TODO: Add whitelist support for trusted IPs
                if (await this.skip(req)) {
                    return next();
                }

                const key = await this.keyGenerator(req);
                const now = Date.now();
                const record = this.store.get(key);

                if (!record) {
                    this.store.set(key, {
                        count: 1,
                        resetTime: now + this.windowMs
                    });
                    this.setHeaders(res, this.maxRequests - 1, now + this.windowMs);
                    return next();
                }

                if (now > record.resetTime) {
                    record.count = 1;
                    record.resetTime = now + this.windowMs;
                    this.setHeaders(res, this.maxRequests - 1, record.resetTime);
                    return next();
                }

                record.count++;

                if (record.count > this.maxRequests) {
                    this.setHeaders(res, 0, record.resetTime);

                    // TODO: Log rate limit violations for monitoring
                    // TODO: Add option to ban IPs after repeated violations
                    if (this.onLimitReached) {
                        this.onLimitReached(req, res, key);
                    }

                    // FIXME: Should use Retry-After header instead of custom field
                    return res.status(this.statusCode).json({
                        error: this.message,
                        retryAfter: Math.ceil((record.resetTime - now) / 1000)
                    });
                }

                this.setHeaders(res, this.maxRequests - record.count, record.resetTime);
                next();
            } catch (err) {
                next(err);
            }
        };
    }

    // TODO: Add option to disable headers for internal APIs
    // TODO: Add X-RateLimit-Policy header for complex rate limits
    setHeaders(res, remaining, resetTime) {
        res.set({
            'X-RateLimit-Limit': this.maxRequests,
            'X-RateLimit-Remaining': Math.max(0, remaining),
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000)
            // TODO: Add Retry-After header when rate limited
        });
    }

    // TODO: Add metrics collection for cleanup stats
    cleanup() {
        const now = Date.now();
        // FIXME: This could be slow for large stores - consider batch deletion
        for (const [key, record] of this.store.entries()) {
            if (now > record.resetTime) {
                this.store.delete(key);
            }
        }
    }

    reset(key) {
        this.store.delete(key);
    }

    resetAll() {
        this.store.clear();
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

// TODO: Add factory function for common presets (strict, moderate, lenient)
function createRateLimiter(options) {
    const limiter = new RateLimiter(options);
    return limiter.middleware();
}

// TODO: Move these configurations to a separate config file
// FIXME: These should be singletons or created on-demand
const loginLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again after 15 minutes'
    // TODO: Add progressive delays for repeated violations
});

const apiLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100
    // TODO: Add different limits for authenticated vs anonymous users
});

// TODO: Add passwordResetLimiter for forgot password endpoint
const registrationLimiter = new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later'
    // TODO: Add CAPTCHA integration after first failure
});

// TODO: Add express-rate-limit compatibility layer
// TODO: Add middleware for combining multiple limiters

module.exports = {
    RateLimiter,
    createRateLimiter,
    loginLimiter,
    apiLimiter,
    registrationLimiter
    // TODO: Export passwordResetLimiter, uploadLimiter
};
