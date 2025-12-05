const express = require('express');
const router = express.Router();
const { generateToken, hashPassword, verifyPassword, authenticateToken } = require('./ssss');

// TODO: Migrate to persistent database storage
const users = new Map();

router.post('/register', (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // FIXME: Case-sensitive email check may cause duplicate accounts
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

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = users.get(email);

    if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // TODO: Implement refresh token mechanism
    const token = generateToken({ id: user.id, email: user.email });

    res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name },
        token
    });
});

router.get('/profile', authenticateToken, (req, res) => {
    // FIXME: O(n) lookup - need to add secondary index by user ID
    const user = Array.from(users.values()).find(u => u.id === req.user.id);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
    });
});

// TODO: Add password reset endpoints
// TODO: Add email verification flow

module.exports = router;
