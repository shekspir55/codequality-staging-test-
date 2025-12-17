const { RateLimiter } = require('../rateLimiter');

describe('RateLimiter', () => {
    let limiter;

    beforeEach(() => {
        limiter = new RateLimiter({
            windowMs: 1000,
            maxRequests: 3
        });
    });

    afterEach(() => {
        limiter.destroy();
    });

    describe('constructor', () => {
        it('should use default values when no options provided', () => {
            const defaultLimiter = new RateLimiter();
            expect(defaultLimiter.windowMs).toBe(60000);
            expect(defaultLimiter.maxRequests).toBe(100);
            defaultLimiter.destroy();
        });

        it('should accept custom options', () => {
            expect(limiter.windowMs).toBe(1000);
            expect(limiter.maxRequests).toBe(3);
        });
    });

    describe('defaultKeyGenerator', () => {
        it('should extract IP from request', () => {
            const req = { ip: '192.168.1.1' };
            expect(limiter.defaultKeyGenerator(req)).toBe('192.168.1.1');
        });

        it('should fallback to connection.remoteAddress', () => {
            const req = { connection: { remoteAddress: '10.0.0.1' } };
            expect(limiter.defaultKeyGenerator(req)).toBe('10.0.0.1');
        });

        it('should return unknown when no IP available', () => {
            const req = {};
            expect(limiter.defaultKeyGenerator(req)).toBe('unknown');
        });
    });

    describe('middleware', () => {
        const mockReq = (ip = '127.0.0.1') => ({ ip });
        const mockRes = () => {
            const res = {
                headers: {},
                statusCode: null,
                body: null,
                set: jest.fn((headers) => { res.headers = { ...res.headers, ...headers }; }),
                status: jest.fn((code) => { res.statusCode = code; return res; }),
                json: jest.fn((data) => { res.body = data; })
            };
            return res;
        };
        const mockNext = jest.fn();

        beforeEach(() => {
            mockNext.mockClear();
        });

        it('should allow requests within limit', async () => {
            const middleware = limiter.middleware();
            const req = mockReq();
            const res = mockRes();

            await middleware(req, res, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(res.headers['X-RateLimit-Remaining']).toBe(2);
        });

        it('should block requests exceeding limit', async () => {
            const middleware = limiter.middleware();
            const req = mockReq();

            // Make 3 allowed requests
            for (let i = 0; i < 3; i++) {
                await middleware(req, mockRes(), mockNext);
            }

            // 4th request should be blocked
            const res = mockRes();
            mockNext.mockClear();
            await middleware(req, res, mockNext);

            expect(mockNext).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(429);
            expect(res.body.error).toBeDefined();
        });

        it('should track different IPs separately', async () => {
            const middleware = limiter.middleware();
            const req1 = mockReq('192.168.1.1');
            const req2 = mockReq('192.168.1.2');
            const res1 = mockRes();
            const res2 = mockRes();

            await middleware(req1, res1, mockNext);
            await middleware(req2, res2, mockNext);

            expect(res1.headers['X-RateLimit-Remaining']).toBe(2);
            expect(res2.headers['X-RateLimit-Remaining']).toBe(2);
        });
    });

    describe('reset', () => {
        it('should reset counter for specific key', async () => {
            const middleware = limiter.middleware();
            const req = { ip: '192.168.1.1' };
            const res = { set: jest.fn() };
            const next = jest.fn();

            await middleware(req, res, next);
            expect(limiter.store.has('192.168.1.1')).toBe(true);

            limiter.reset('192.168.1.1');
            expect(limiter.store.has('192.168.1.1')).toBe(false);
        });
    });

    describe('resetAll', () => {
        it('should clear all counters', async () => {
            const middleware = limiter.middleware();
            const next = jest.fn();
            const res = { set: jest.fn() };

            await middleware({ ip: '1.1.1.1' }, res, next);
            await middleware({ ip: '2.2.2.2' }, res, next);
            expect(limiter.store.size).toBe(2);

            limiter.resetAll();
            expect(limiter.store.size).toBe(0);
        });
    });

    describe('cleanup', () => {
        it('should remove expired entries', async () => {
            const shortLimiter = new RateLimiter({
                windowMs: 50,
                maxRequests: 10
            });

            const middleware = shortLimiter.middleware();
            await middleware({ ip: '1.1.1.1' }, { set: jest.fn() }, jest.fn());
            expect(shortLimiter.store.size).toBe(1);

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 100));
            shortLimiter.cleanup();
            expect(shortLimiter.store.size).toBe(0);

            shortLimiter.destroy();
        });
    });
});
