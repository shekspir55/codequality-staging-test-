const express = require('express');
const router = express.Router();
const { generateToken, hashPassword, verifyPassword, authenticateToken } = require('./ssss');

const users = new Map();

router.post('/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (users.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = hashPassword(password);
    const user = {
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        createdAt: new Date().toISOString()
    };

    users.set(email, user);

    const token = generateToken({ id: user.id, email: user.email });

    res.status(201).json({
        message: 'Registration successful',
        user: { id: user.id, email: user.email, name: user.name },
        token
    });
});