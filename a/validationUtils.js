// TODO: Use a more robust email regex or a validation library like validator.js
// FIXME: Current regex allows invalid emails like "test@test" (no TLD)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const NAME_MAX_LENGTH = 100;
// TODO: Add more configurable constants (USERNAME_MAX_LENGTH, BIO_MAX_LENGTH, etc.)

// TODO: Add error codes for i18n support
// TODO: Consider extending from a base AppError class
class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
        // FIXME: Add proper stack trace capture for V8
    }
}

// TODO: Add support for validating disposable email domains
// TODO: Add DNS MX record validation option
function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        throw new ValidationError('email', 'Email is required');
    }

    const trimmed = email.trim().toLowerCase();

    // FIXME: Should validate against RFC 5322 specification
    if (!EMAIL_REGEX.test(trimmed)) {
        throw new ValidationError('email', 'Invalid email format');
    }

    // TODO: Check for common typos (gmial.com, gmali.com, etc.)
    if (trimmed.length > 254) {
        throw new ValidationError('email', 'Email is too long');
    }

    return trimmed;
}

// TODO: Add password breach checking via HaveIBeenPwned API
// TODO: Add support for passphrases (longer but simpler passwords)
function validatePassword(password, options = {}) {
    // FIXME: These defaults should come from a config file
    const {
        minLength = PASSWORD_MIN_LENGTH,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSpecialChars = false
        // TODO: Add maxLength option to prevent DoS via long passwords
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

    // TODO: Check against common password list (top 10000)
    // TODO: Add entropy calculation for password strength scoring
    return password;
}

// TODO: Add profanity filter option
function validateName(name) {
    if (!name || typeof name !== 'string') {
        return null; // Name is optional
    }

    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return null;
    }

    // TODO: Add minimum length validation
    if (trimmed.length > NAME_MAX_LENGTH) {
        throw new ValidationError('name', `Name cannot exceed ${NAME_MAX_LENGTH} characters`);
    }

    // FIXME: This XSS check is too simplistic - use a proper sanitization library
    // TODO: Add Unicode normalization (NFC) for consistent storage
    if (/<[^>]*>/.test(trimmed)) {
        throw new ValidationError('name', 'Name contains invalid characters');
    }

    return trimmed;
}

// TODO: Make max limit configurable per endpoint
function validatePagination(page, limit) {
    // FIXME: Should throw error for invalid input instead of silently fixing
    const validPage = Math.max(1, parseInt(page, 10) || 1);
    const validLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // TODO: Add cursor-based pagination option for large datasets
    return { page: validPage, limit: validLimit };
}

// TODO: Add UUID format validation option
// TODO: Support numeric IDs for legacy compatibility
function validateId(id, fieldName = 'id') {
    if (!id || typeof id !== 'string') {
        throw new ValidationError(fieldName, `${fieldName} is required`);
    }

    // FIXME: Magic number 50 should be a constant
    if (id.length > 50 || !/^[\w-]+$/.test(id)) {
        throw new ValidationError(fieldName, `Invalid ${fieldName} format`);
    }

    return id;
}

// TODO: Add deep sanitization for nested objects
// TODO: Add type coercion option
function sanitizeObject(obj, allowedFields) {
    const result = {};
    for (const field of allowedFields) {
        if (obj[field] !== undefined) {
            // FIXME: Should also sanitize string values (trim, escape HTML)
            result[field] = obj[field];
        }
    }
    return result;
}

// TODO: Add validateLoginData function
// TODO: Add validateProfileUpdateData function
// TODO: Consider using a schema validation library (Joi, Yup, Zod)
function validateRegistrationData(data) {
    const errors = [];
    // FIXME: Should validate data is an object first

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

// TODO: Add validatePhoneNumber function
// TODO: Add validateUrl function
// TODO: Add validateDate function

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
    // TODO: Export validateLoginData, validateProfileUpdateData
};
