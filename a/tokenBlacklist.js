/**
 * Token blacklist for invalidating JWT tokens on logout
 */

class TokenBlacklist {
    constructor(options = {}) {
        this.blacklist = new Map();
        this.defaultTTL = options.ttl || 24 * 60 * 60 * 1000; // 24 hours

        // Periodic cleanup
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    add(token, expiresAt = null) {
        const expiry = expiresAt || Date.now() + this.defaultTTL;
        this.blacklist.set(token, expiry);
    }

    isBlacklisted(token) {
        if (!this.blacklist.has(token)) {
            return false;
        }

        const expiry = this.blacklist.get(token);
        if (Date.now() > expiry) {
            this.blacklist.delete(token);
            return false;
        }

        return true;
    }

    remove(token) {
        return this.blacklist.delete(token);
    }

    cleanup() {
        const now = Date.now();
        for (const [token, expiry] of this.blacklist) {
            if (now > expiry) {
                this.blacklist.delete(token);
            }
        }
    }

    size() {
        return this.blacklist.size;
    }

    clear() {
        this.blacklist.clear();
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.blacklist.clear();
    }
}

const tokenBlacklist = new TokenBlacklist();

module.exports = { TokenBlacklist, tokenBlacklist };
