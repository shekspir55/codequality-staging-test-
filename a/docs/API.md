# API Documentation

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Register User

```
POST /auth/register
```

Creates a new user account and returns a JWT token.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters |
| name | string | No | Display name |

#### Response Codes

| Code | Description |
|------|-------------|
| 201 | User created successfully |
| 400 | Missing required fields |
| 409 | Email already registered |

---

### Login

```
POST /auth/login
```

Authenticates a user and returns a JWT token.

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | Registered email |
| password | string | Yes | Account password |

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Login successful |
| 400 | Missing required fields |
| 401 | Invalid credentials |

---

### Get Profile

```
GET /auth/profile
```

Returns the authenticated user's profile information.

#### Headers

| Name | Required | Description |
|------|----------|-------------|
| Authorization | Yes | Bearer token |

#### Response Codes

| Code | Description |
|------|-------------|
| 200 | Profile returned |
| 401 | Token missing |
| 403 | Token invalid/expired |
| 404 | User not found |

## Rate Limiting

API endpoints are protected by rate limiting:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/login | 5 requests | 15 minutes |
| /auth/register | 3 requests | 1 hour |
| General API | 100 requests | 1 minute |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Rate limit errors include additional info:

```json
{
  "error": "Too many requests",
  "retryAfter": 300
}
```
