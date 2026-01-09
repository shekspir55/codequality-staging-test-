const request = require('supertest');
const express = require('express');
const authRoutes = require('../vauthRoutes');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'Password123',
                    name: 'Test User'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBe('Registration successful');
            expect(res.body.user.email).toBe('test@example.com');
            expect(res.body.token).toBeDefined();
        });

        it('should return 400 if email is missing', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    password: 'Password123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Email and password are required');
        });

        it('should return 400 if password is missing', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'test2@example.com'
                });

            expect(res.statusCode).toBe(400);
        });

        it('should return 409 if user already exists', async () => {
            // First registration
            await request(app)
                .post('/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'Password123'
                });

            // Duplicate registration
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'duplicate@example.com',
                    password: 'Password123'
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe('User already exists');
        });
    });

    describe('POST /auth/login', () => {
        beforeAll(async () => {
            await request(app)
                .post('/auth/register')
                .send({
                    email: 'login@example.com',
                    password: 'Password123'
                });
        });

        it('should login successfully with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'Password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Login successful');
            expect(res.body.token).toBeDefined();
        });

        it('should return 401 with invalid password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'WrongPassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toBe('Invalid credentials');
        });

        it('should return 401 for non-existent user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /auth/profile', () => {
        let authToken;

        beforeAll(async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    email: 'profile@example.com',
                    password: 'Password123',
                    name: 'Profile User'
                });
            authToken = res.body.token;
        });

        it('should return profile for authenticated user', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.email).toBe('profile@example.com');
            expect(res.body.name).toBe('Profile User');
        });

        it('should return 401 without token', async () => {
            const res = await request(app)
                .get('/auth/profile');

            expect(res.statusCode).toBe(401);
        });

        it('should return 403 with invalid token', async () => {
            const res = await request(app)
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).toBe(403);
        });
    });
});
