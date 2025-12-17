const {
    validateEmail,
    validatePassword,
    validateName,
    validatePagination,
    validateId,
    ValidationError
} = require('../validationUtils');

describe('Validation Utils', () => {
    describe('validateEmail', () => {
        it('should accept valid email addresses', () => {
            expect(validateEmail('user@example.com')).toBe('user@example.com');
            expect(validateEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
            expect(validateEmail('  user@example.com  ')).toBe('user@example.com');
        });

        it('should throw for invalid email formats', () => {
            expect(() => validateEmail('invalid')).toThrow(ValidationError);
            expect(() => validateEmail('invalid@')).toThrow(ValidationError);
            expect(() => validateEmail('@example.com')).toThrow(ValidationError);
        });

        it('should throw for missing email', () => {
            expect(() => validateEmail('')).toThrow(ValidationError);
            expect(() => validateEmail(null)).toThrow(ValidationError);
            expect(() => validateEmail(undefined)).toThrow(ValidationError);
        });

        it('should throw for email exceeding max length', () => {
            const longEmail = 'a'.repeat(250) + '@example.com';
            expect(() => validateEmail(longEmail)).toThrow(ValidationError);
        });
    });

    describe('validatePassword', () => {
        it('should accept valid passwords', () => {
            expect(validatePassword('Password1')).toBe('Password1');
            expect(validatePassword('Abcdefg1')).toBe('Abcdefg1');
        });

        it('should throw for short passwords', () => {
            expect(() => validatePassword('Pass1')).toThrow(ValidationError);
        });

        it('should throw for passwords without uppercase', () => {
            expect(() => validatePassword('password1')).toThrow(ValidationError);
        });

        it('should throw for passwords without lowercase', () => {
            expect(() => validatePassword('PASSWORD1')).toThrow(ValidationError);
        });

        it('should throw for passwords without numbers', () => {
            expect(() => validatePassword('Passwordd')).toThrow(ValidationError);
        });

        it('should respect custom options', () => {
            const options = { requireSpecialChars: true };
            expect(() => validatePassword('Password1', options)).toThrow(ValidationError);
            expect(validatePassword('Password1!', options)).toBe('Password1!');
        });
    });

    describe('validateName', () => {
        it('should accept valid names', () => {
            expect(validateName('John Doe')).toBe('John Doe');
            expect(validateName('  Jane  ')).toBe('Jane');
        });

        it('should return null for empty names', () => {
            expect(validateName('')).toBeNull();
            expect(validateName(null)).toBeNull();
            expect(validateName(undefined)).toBeNull();
        });

        it('should throw for names with HTML tags', () => {
            expect(() => validateName('<script>alert("xss")</script>')).toThrow(ValidationError);
        });

        it('should throw for names exceeding max length', () => {
            const longName = 'a'.repeat(101);
            expect(() => validateName(longName)).toThrow(ValidationError);
        });
    });

    describe('validatePagination', () => {
        it('should return valid pagination values', () => {
            expect(validatePagination(1, 10)).toEqual({ page: 1, limit: 10 });
            expect(validatePagination(5, 50)).toEqual({ page: 5, limit: 50 });
        });

        it('should enforce minimum values', () => {
            expect(validatePagination(0, 0)).toEqual({ page: 1, limit: 1 });
            expect(validatePagination(-1, -1)).toEqual({ page: 1, limit: 1 });
        });

        it('should enforce maximum limit', () => {
            expect(validatePagination(1, 200)).toEqual({ page: 1, limit: 100 });
        });

        it('should handle invalid inputs', () => {
            expect(validatePagination('abc', 'xyz')).toEqual({ page: 1, limit: 20 });
            expect(validatePagination(null, null)).toEqual({ page: 1, limit: 20 });
        });
    });

    describe('validateId', () => {
        it('should accept valid IDs', () => {
            expect(validateId('usr_123456')).toBe('usr_123456');
            expect(validateId('abc-def-123')).toBe('abc-def-123');
        });

        it('should throw for missing ID', () => {
            expect(() => validateId('')).toThrow(ValidationError);
            expect(() => validateId(null)).toThrow(ValidationError);
        });

        it('should throw for invalid ID format', () => {
            expect(() => validateId('id with spaces')).toThrow(ValidationError);
            expect(() => validateId('id/with/slashes')).toThrow(ValidationError);
        });
    });
});
