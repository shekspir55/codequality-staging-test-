# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Token blacklist for logout functionality
- Session manager for tracking active sessions
- Email service for transactional emails
- Metrics collection module
- Database connection utilities
- Request logging middleware
- Readiness probe endpoint (`/ready`)
- ServiceUnavailableError class

### Changed
- Updated README with requirements section
- Health endpoint now includes API version
- Improved error handling with custom error classes

### Fixed
- Case-sensitive email check in registration
- O(n) user lookup in profile endpoint

## [1.0.0] - 2024-01-15

### Added
- Initial release
- User registration and login
- JWT token authentication
- Password hashing with bcrypt
- Rate limiting middleware
- Input validation utilities
- Configurable logging with file rotation
- Profile endpoint
- Basic error handling

### Security
- Implemented bcrypt password hashing
- Added rate limiting for authentication endpoints
- JWT token expiration (24 hours)

## [0.1.0] - 2024-01-01

### Added
- Project scaffolding
- Basic Express server setup
- Initial route structure
