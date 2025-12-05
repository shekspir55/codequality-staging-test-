const EventEmitter = require('events');

// TODO: Add TypeScript types for better IDE support
// TODO: Consider using a dependency injection container
class UserService extends EventEmitter {
    constructor(userRepository) {
        super();
        this.userRepository = userRepository;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        // TODO: Make cache timeout configurable via constructor options
        // TODO: Add Redis support for distributed caching
    }

    async findById(userId) {
        const cached = this.cache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.user;
        }

        const user = await this.userRepository.findById(userId);
        if (user) {
            this.cache.set(userId, { user, timestamp: Date.now() });
        }
        return user;
    }

    async findByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        // TODO: Add email format validation here
        return this.userRepository.findByEmail(normalizedEmail);
    }

    async createUser(userData) {
        // TODO: Add input validation using validationUtils
        // TODO: Implement email verification flow
        // TODO: Add support for OAuth providers (Google, GitHub)
        const { email, password, name, role = 'user' } = userData;

        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const user = {
            id: this.generateId(),
            email: email.toLowerCase().trim(),
            name: name || this.extractNameFromEmail(email),
            role,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const savedUser = await this.userRepository.create(user, password);
        this.emit('user:created', { userId: savedUser.id, email: savedUser.email });

        return this.sanitizeUser(savedUser);
    }

    async updateUser(userId, updates) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const allowedFields = ['name', 'email', 'isActive'];
        const sanitizedUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                sanitizedUpdates[field] = updates[field];
            }
        }

        sanitizedUpdates.updatedAt = new Date().toISOString();

        const updatedUser = await this.userRepository.update(userId, sanitizedUpdates);
        this.cache.delete(userId);
        this.emit('user:updated', { userId, updates: Object.keys(sanitizedUpdates) });

        return this.sanitizeUser(updatedUser);
    }

    async deleteUser(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        await this.userRepository.delete(userId);
        this.cache.delete(userId);
        this.emit('user:deleted', { userId, email: user.email });

        return true;
    }

    async listUsers(options = {}) {
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const offset = (page - 1) * limit;

        const result = await this.userRepository.findAll({
            offset,
            limit,
            sortBy,
            sortOrder
        });

        return {
            users: result.users.map(u => this.sanitizeUser(u)),
            total: result.total,
            page,
            totalPages: Math.ceil(result.total / limit)
        };
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isValid = await this.userRepository.verifyPassword(userId, oldPassword);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }

        await this.userRepository.updatePassword(userId, newPassword);
        this.emit('user:password_changed', { userId });

        return true;
    }

    async deactivateUser(userId) {
        return this.updateUser(userId, { isActive: false });
    }

    async activateUser(userId) {
        return this.updateUser(userId, { isActive: true });
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    extractNameFromEmail(email) {
        return email.split('@')[0].replace(/[._-]/g, ' ');
    }

    generateId() {
        return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    clearCache() {
        this.cache.clear();
    }
}

module.exports = UserService;
