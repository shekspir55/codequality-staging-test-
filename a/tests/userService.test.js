const UserService = require('../userService');

describe('UserService', () => {
    let userService;
    let mockRepository;

    beforeEach(() => {
        mockRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
            verifyPassword: jest.fn(),
            updatePassword: jest.fn()
        };
        userService = new UserService(mockRepository);
    });

    describe('findById', () => {
        it('should return cached user if available', async () => {
            const user = { id: '123', email: 'test@example.com' };
            userService.cache.set('123', { user, timestamp: Date.now() });

            const result = await userService.findById('123');
            expect(result).toEqual(user);
            expect(mockRepository.findById).not.toHaveBeenCalled();
        });

        it('should fetch from repository if not cached', async () => {
            const user = { id: '123', email: 'test@example.com' };
            mockRepository.findById.mockResolvedValue(user);

            const result = await userService.findById('123');
            expect(result).toEqual(user);
            expect(mockRepository.findById).toHaveBeenCalledWith('123');
        });

        it('should cache fetched user', async () => {
            const user = { id: '123', email: 'test@example.com' };
            mockRepository.findById.mockResolvedValue(user);

            await userService.findById('123');
            expect(userService.cache.has('123')).toBe(true);
        });
    });

    describe('findByEmail', () => {
        it('should normalize email before searching', async () => {
            await userService.findByEmail('  TEST@EXAMPLE.COM  ');
            expect(mockRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
        });
    });

    describe('createUser', () => {
        it('should create user with normalized data', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);
            mockRepository.create.mockImplementation((user) => Promise.resolve(user));

            const result = await userService.createUser({
                email: 'NEW@EXAMPLE.COM',
                password: 'password123',
                name: 'New User'
            });

            expect(result.email).toBe('new@example.com');
            expect(result.name).toBe('New User');
            expect(result.isActive).toBe(true);
        });

        it('should throw if email already exists', async () => {
            mockRepository.findByEmail.mockResolvedValue({ id: 'existing' });

            await expect(userService.createUser({
                email: 'existing@example.com',
                password: 'password123'
            })).rejects.toThrow('User with this email already exists');
        });

        it('should emit user:created event', async () => {
            mockRepository.findByEmail.mockResolvedValue(null);
            mockRepository.create.mockImplementation((user) => Promise.resolve(user));

            const eventHandler = jest.fn();
            userService.on('user:created', eventHandler);

            await userService.createUser({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(eventHandler).toHaveBeenCalled();
        });
    });

    describe('updateUser', () => {
        it('should only update allowed fields', async () => {
            const existingUser = { id: '123', email: 'test@example.com', name: 'Old Name' };
            userService.cache.set('123', { user: existingUser, timestamp: Date.now() });
            mockRepository.update.mockImplementation((id, updates) =>
                Promise.resolve({ ...existingUser, ...updates })
            );

            await userService.updateUser('123', {
                name: 'New Name',
                email: 'new@example.com',
                password: 'should-be-ignored',
                role: 'admin'
            });

            expect(mockRepository.update).toHaveBeenCalledWith('123', expect.objectContaining({
                name: 'New Name',
                email: 'new@example.com'
            }));
            expect(mockRepository.update).toHaveBeenCalledWith('123', expect.not.objectContaining({
                password: expect.anything(),
                role: expect.anything()
            }));
        });

        it('should clear cache after update', async () => {
            const existingUser = { id: '123', email: 'test@example.com' };
            userService.cache.set('123', { user: existingUser, timestamp: Date.now() });
            mockRepository.update.mockResolvedValue(existingUser);

            await userService.updateUser('123', { name: 'Updated' });
            expect(userService.cache.has('123')).toBe(false);
        });
    });

    describe('deleteUser', () => {
        it('should delete user and clear cache', async () => {
            const user = { id: '123', email: 'test@example.com' };
            userService.cache.set('123', { user, timestamp: Date.now() });
            mockRepository.delete.mockResolvedValue(true);

            const result = await userService.deleteUser('123');
            expect(result).toBe(true);
            expect(mockRepository.delete).toHaveBeenCalledWith('123');
            expect(userService.cache.has('123')).toBe(false);
        });

        it('should throw if user not found', async () => {
            userService.cache.clear();
            mockRepository.findById.mockResolvedValue(null);

            await expect(userService.deleteUser('nonexistent'))
                .rejects.toThrow('User not found');
        });
    });

    describe('listUsers', () => {
        it('should return paginated results', async () => {
            mockRepository.findAll.mockResolvedValue({
                users: [{ id: '1' }, { id: '2' }],
                total: 50
            });

            const result = await userService.listUsers({ page: 2, limit: 10 });

            expect(result.page).toBe(2);
            expect(result.total).toBe(50);
            expect(result.totalPages).toBe(5);
            expect(mockRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({
                offset: 10,
                limit: 10
            }));
        });
    });

    describe('getCacheStats', () => {
        it('should return cache statistics', () => {
            userService.cache.set('1', { user: {}, timestamp: Date.now() });
            userService.cache.set('2', { user: {}, timestamp: Date.now() });

            const stats = userService.getCacheStats();
            expect(stats.size).toBe(2);
            expect(stats.timeout).toBe(5 * 60 * 1000);
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = userService.generateId();
            const id2 = userService.generateId();

            expect(id1).toMatch(/^usr_\d+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });
    });

    describe('extractNameFromEmail', () => {
        it('should extract name from email', () => {
            expect(userService.extractNameFromEmail('john.doe@example.com')).toBe('john doe');
            expect(userService.extractNameFromEmail('jane_smith@example.com')).toBe('jane smith');
            expect(userService.extractNameFromEmail('user-name@example.com')).toBe('user name');
        });
    });
});
