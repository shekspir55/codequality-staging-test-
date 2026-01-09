// FIXME: This regex doesn't handle all valid email formats
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 100;

class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('email', 'Email is required');
    }

    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmed)) {
        throw new ValidationError('email', 'Invalid email format');
    }

    if (trimmed.length > 254) {
        throw new ValidationError('email', 'Email is too long');
    }

    return trimmed;
}

function validatePassword(password, options = {}) {
    const {
        minLength = PASSWORD_MIN_LENGTH,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = false
    } = options;

    if (!password || typeof password !== 'string') {
        throw new ValidationError('password', 'Password is required');
    }

    if (password.length < minLength) {
        throw new ValidationError('password', `Password must be at least ${minLength} characters`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
        throw new ValidationError('password', 'Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
        throw new ValidationError('password', 'Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
        throw new ValidationError('password', 'Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new ValidationError('password', 'Password must contain at least one special character');
    }

    // TODO: Check against common password dictionary
    return password;
}

function validateName(name) {
    if (!name || typeof name !== 'string') {
        return null; // Name is optional
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return null;
    }

    if (trimmed.length > NAME_MAX_LENGTH) {
        throw new ValidationError('name', `Name cannot exceed ${NAME_MAX_LENGTH} characters`);
    }

    if (/<[^>]*>/.test(trimmed)) {
        throw new ValidationError('name', 'Name contains invalid characters');
    }

    return trimmed;
}

function validatePagination(page, limit) {
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    return { page: validPage, limit: validLimit };
}

function validateId(id, fieldName = 'id') {
    if (!id || typeof id !== 'string') {
        throw new ValidationError(fieldName, `${fieldName} is required`);
    }

    if (id.length > 50 || !/^[\w-]+$/.test(id)) {
        throw new ValidationError(fieldName, `Invalid ${fieldName} format`);
    }

    return id;
}

function sanitizeObject(obj, allowedFields) {
    // TODO: Add deep cloning to prevent prototype pollution
    const result = {};
    for (const field of allowedFields) {
        if (obj[field] !== undefined) {
            result[field] = obj[field];
        }
    }
    return result;
}

function validateRegistrationData(data) {
    const errors = [];

    try {
        data.email = validateEmail(data.email);
    } catch (e) {
        errors.push({ field: e.field, message: e.message });
    }

    try {
        validatePassword(data.password);
    } catch (e) {
        errors.push({ field: e.field, message: e.message });
    }

    try {
        data.name = validateName(data.name);
    } catch (e) {
        errors.push({ field: e.field, message: e.message });
    }

    if (errors.length > 0) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.errors = errors;
        throw error;
    }

    return data;
}


module.exports = {
    ValidationError,
    validateEmail,
    validatePassword,
    validateName,
    validatePagination,
    validateId,
    sanitizeObject,
    validateRegistrationData,
    EMAIL_REGEX,
    PASSWORD_MIN_LENGTH,
    NAME_MAX_LENGTH
};
