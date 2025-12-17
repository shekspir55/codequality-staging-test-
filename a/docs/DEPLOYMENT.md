# Deployment Guide

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- PostgreSQL 14+ (optional, for production)

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the values in `.env`:
```bash
NODE_ENV=production
JWT_SECRET=your-secure-random-string-here
PORT=3000
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Production Deployment

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

Build and run:
```bash
docker build -t auth-api .
docker run -p 3000:3000 --env-file .env auth-api
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name auth-api

# View logs
pm2 logs auth-api

# Restart
pm2 restart auth-api
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

## Health Checks

- **Liveness**: `GET /health`
- **Readiness**: `GET /ready`

## Monitoring

The `/health` endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "v1"
}
```

## Scaling

The application is stateless and can be horizontally scaled.

**Note**: When running multiple instances, use Redis for:
- Rate limiting store
- Session management
- Token blacklist

## Rollback

```bash
# Using PM2
pm2 deploy production revert 1

# Using Docker
docker pull auth-api:previous-tag
docker-compose up -d
```
