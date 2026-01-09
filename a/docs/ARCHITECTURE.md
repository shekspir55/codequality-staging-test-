# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────┐
│                    Express Application                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rate Limiter │──│ Auth Routes  │──│  Middleware  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                           │                             │
│                           ▼                             │
│                    ┌──────────────┐                     │
│                    │ User Service │                     │
│                    └──────────────┘                     │
│                           │                             │
│              ┌────────────┼────────────┐               │
│              ▼            ▼            ▼               │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│       │  Cache   │ │Repository│ │  Logger  │          │
│       └──────────┘ └──────────┘ └──────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Module Responsibilities

### vauthRoutes.js
- HTTP request handling
- Input extraction from requests
- Response formatting
- Route definitions

### ssss.js (Auth Middleware)
- JWT token generation and verification
- Password hashing and comparison
- Authentication middleware

### userService.js
- Business logic for user operations
- Caching layer management
- Event emission for user lifecycle
- Data sanitization

### validationUtils.js
- Input validation rules
- Error message generation
- Data sanitization helpers

### rateLimiter.js
- Request counting per client
- Rate limit enforcement
- Header management

### logger.js
- Log formatting
- Multiple transports (console, file)
- Log rotation

## Data Flow

### Registration Flow
1. Request hits rate limiter
2. Route extracts email, password, name
3. Password is hashed
4. User object is created
5. JWT token is generated
6. Response sent to client

### Authentication Flow
1. Request hits rate limiter
2. Credentials extracted
3. User lookup by email
4. Password verification
5. JWT token generated
6. Token sent to client

### Protected Route Flow
1. Token extracted from header
2. Token verified and decoded
3. User info attached to request
4. Route handler executes
5. Response sent

## Security Considerations

- Passwords never stored in plain text
- JWT tokens expire after 24 hours
- Rate limiting prevents brute force
- Input validation prevents injection
