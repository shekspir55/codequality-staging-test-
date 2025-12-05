class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
        this.maxRequests = options.maxRequests || 100;
        this.message = options.message || 'Too many requests, please try again later';
        this.statusCode = options.statusCode || 429;
        this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
        this.skip = options.skip || (() => false);
        this.onLimitReached = options.onLimitReached || null;

        this.store = new Map();
        this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
    }

    defaultKeyGenerator(req) {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    middleware() {
        return async (req, res, next) => {
            try {
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

                    if (this.onLimitReached) {
                        this.onLimitReached(req, res, key);
                    }

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

    setHeaders(res, remaining, resetTime) {
        res.set({
            'X-RateLimit-Limit': this.maxRequests,
            'X-RateLimit-Remaining': Math.max(0, remaining),
            'X-RateLimit-Reset': Math.ceil(resetTime / 1000)
        });
    }

    cleanup() {
        const now = Date.now();
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

function createRateLimiter(options) {
    const limiter = new RateLimiter(options);
    return limiter.middleware();
}

const loginLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many login attempts, please try again after 15 minutes'
});

const apiLimiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100
});

const registrationLimiter = new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many registration attempts, please try again later'
});


module.exports = {
    RateLimiter,
    createRateLimiter,
    loginLimiter,
    apiLimiter,
    registrationLimiter
};
