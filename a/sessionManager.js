/**
 * Session management for tracking active user sessions
 */

const crypto = require('crypto');

class SessionManager {
    constructor(options = {}) {
        this.sessions = new Map();
        this.sessionTTL = options.ttl || 24 * 60 * 60 * 1000; // 24 hours
        this.maxSessionsPerUser = options.maxPerUser || 5;

        // Cleanup expired sessions periodically
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }

    generateSessionId() {
        return crypto.randomBytes(32).toString('hex');
    }

    create(userId, metadata = {}) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.sessionTTL,
            lastActivity: Date.now(),
            metadata: {
                userAgent: metadata.userAgent || 'unknown',
                ipAddress: metadata.ipAddress || 'unknown',
                ...metadata
            }
        };

        // Enforce max sessions per user
        this.enforceMaxSessions(userId);

        this.sessions.set(sessionId, session);
        return session;
    }

    get(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }

        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return null;
        }

        return session;
    }

    refresh(sessionId) {
        const session = this.get(sessionId);
        if (!session) {
            return null;
        }

        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + this.sessionTTL;
        return session;
    }

    revoke(sessionId) {
        return this.sessions.delete(sessionId);
    }

    revokeAllForUser(userId) {
        let count = 0;
        for (const [id, session] of this.sessions) {
            if (session.userId === userId) {
                this.sessions.delete(id);
                count++;
            }
        }
        return count;
    }

    getUserSessions(userId) {
        const userSessions = [];
        for (const session of this.sessions.values()) {
            if (session.userId === userId && Date.now() < session.expiresAt) {
                userSessions.push(session);
            }
        }
        return userSessions;
    }

    enforceMaxSessions(userId) {
        const userSessions = this.getUserSessions(userId);
        if (userSessions.length >= this.maxSessionsPerUser) {
            // Remove oldest session
            const oldest = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
            this.revoke(oldest.id);
        }
    }

    cleanup() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now > session.expiresAt) {
                this.sessions.delete(id);
            }
        }
    }

    getStats() {
        return {
            totalSessions: this.sessions.size,
            ttl: this.sessionTTL,
            maxPerUser: this.maxSessionsPerUser
        };
    }

    destroy() {
        clearInterval(this.cleanupInterval);
        this.sessions.clear();
    }
}

module.exports = { SessionManager };
