# Authentication API

> A secure, production-ready Node.js authentication system with user management, rate limiting, and logging utilities.

## Features

- User registration and login with JWT tokens
- Password hashing with bcrypt
- Rate limiting middleware
- Configurable logging with file rotation
- Input validation utilities

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

```bash
npm install
```

## Quick Start

```javascript
const express = require('express');
const authRoutes = require('./vauthRoutes');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

app.listen(3000);
```

## API Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "user": {
    "id": "1234567890",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/login

Authenticate an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### GET /auth/profile

Get the authenticated user's profile. Requires Bearer token.

**Headers:**
```
Authorization: Bearer <token>
```

## Modules

| Module | Description |
|--------|-------------|
| `vauthRoutes.js` | Express router with auth endpoints |
| `ssss.js` | JWT and password utilities |
| `userService.js` | User management business logic |
| `validationUtils.js` | Input validation helpers |
| `rateLimiter.js` | Rate limiting middleware |
| `logger.js` | Logging with file rotation |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |

## License

MIT
