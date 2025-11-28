# CLAUDE.md - Checker: Habit Tracking API

## Project Overview

**Checker** is a habit tracking API backend designed for integration with external clients like Raycast, CLI tools, and mobile applications. It provides a RESTful API for managing habit boards, check-ins, and statistics.

### Core Value Proposition

External applications can integrate habit tracking functionality via API keys, enabling users to:

- Create and manage unlimited habit boards
- Record check-ins with optional quantities
- Access streak statistics and heatmap data
- Use quick actions optimized for CLI/Raycast integration

## Technology Stack

### Backend Framework

- **AdonisJS 6** - TypeScript-first Node.js framework
- **Lucid ORM** - Active Record ORM for database operations
- **VineJS** - Validation library for request validation

### Database

- **Neon PostgreSQL** - Serverless PostgreSQL with branching
  - Production: `main` branch
  - Development: `dev` branch
  - Project ID: `jolly-queen-59157577`

### Authentication

- **Custom API Key System** - No session-based auth
  - API keys with scopes (read, write, delete, admin)
  - Key format: `chk_{environment}_{random_string}`
  - SHA-256 hashed storage for security

### Documentation

- **Hugo** - Static site generator for API documentation
  - Theme: Doks
  - Location: `/docs`

### Development Tools

- **npm** - Package manager
- **ESLint + Prettier** - Linting and formatting
- **TypeScript** - Type safety

## Project Structure

```
checker/
├── app/
│   ├── controllers/           # HTTP controllers
│   │   ├── auth_controller.ts
│   │   ├── api_keys_controller.ts
│   │   ├── boards_controller.ts
│   │   ├── check_ins_controller.ts
│   │   └── users_controller.ts
│   ├── models/                # Lucid ORM models
│   │   ├── user.ts
│   │   ├── api_key.ts
│   │   ├── board.ts
│   │   └── check_in.ts
│   ├── middleware/            # HTTP middleware
│   │   └── api_key_auth_middleware.ts
│   ├── services/              # Business logic
│   │   └── api_key_service.ts
│   └── exceptions/            # Error handlers
├── config/                    # Configuration files
│   ├── app.ts
│   ├── auth.ts
│   ├── database.ts
│   └── cors.ts
├── database/
│   └── migrations/            # Database migrations
├── start/
│   ├── routes.ts              # API routes
│   ├── kernel.ts              # Middleware registration
│   └── env.ts                 # Environment validation
├── docs/                      # Hugo API documentation
│   ├── content/
│   │   ├── getting-started/
│   │   ├── authentication/
│   │   └── api-reference/
│   └── hugo.toml
├── specs/                     # Feature specifications
├── bruno/                     # API testing (Bruno)
└── .env                       # Environment variables
```

## API Endpoints

### Public Routes

```
POST /v1/auth/register     # Create account + get API key
POST /v1/auth/login        # Authenticate + list API keys
```

### Protected Routes (require API key)

```
# User Profile
GET    /v1/users/me
PUT    /v1/users/me
GET    /v1/users/me/dashboard

# API Keys Management
GET    /v1/api-keys
POST   /v1/api-keys
DELETE /v1/api-keys/:id

# Boards
GET    /v1/boards
POST   /v1/boards
GET    /v1/boards/:id
PUT    /v1/boards/:id
DELETE /v1/boards/:id
POST   /v1/boards/:id/archive
POST   /v1/boards/:id/restore
GET    /v1/boards/:id/heatmap
GET    /v1/boards/:id/stats

# Check-ins
GET    /v1/boards/:boardId/check-ins
POST   /v1/boards/:boardId/check-ins
GET    /v1/check-ins/:id
PUT    /v1/check-ins/:id
DELETE /v1/check-ins/:id

# Quick Actions (Raycast/CLI)
POST   /v1/quick/check-in
GET    /v1/quick/status
```

## Database Schema

### Tables

**users**

- `id` (UUID, PK)
- `email`, `name`, `image`, `password`
- `timezone`, `theme`, `notification_settings`
- `created_at`, `updated_at`

**api_keys**

- `id` (UUID, PK)
- `user_id` (FK -> users)
- `name`, `key_hash`, `key_prefix`
- `scopes` (varchar[])
- `expires_at`, `last_used_at`, `last_used_ip`
- `is_revoked`, `revoked_at`

**boards**

- `id` (UUID, PK)
- `user_id` (FK -> users)
- `name`, `description`, `emoji`, `color`
- `unit_type`, `unit`, `target_amount`
- `current_streak`, `longest_streak`, `total_check_ins`
- `is_archived`, `archived_at`, `last_check_in_date`

**check_ins**

- `id` (UUID, PK)
- `board_id` (FK -> boards)
- `user_id` (FK -> users)
- `date`, `timestamp`, `amount`, `note`, `session_number`

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with Neon DATABASE_URL

# Run migrations
node ace migration:run

# Start development server
node ace serve --watch
# Server runs on http://localhost:3333
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require
APP_KEY=<generate-random-32-char-string>

# Optional
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
NODE_ENV=development
```

### Commands

```bash
# Development
node ace serve --watch

# Build
node ace build

# Migrations
node ace migration:run
node ace migration:rollback
node ace make:migration <name>

# Generate
node ace make:controller <name>
node ace make:model <name>
node ace make:middleware <name>

# Documentation (Hugo)
cd docs && hugo server --buildDrafts
```

## Code Conventions

### English for Code & Documentation

- All code, comments, documentation in English
- Commit messages in English
- Log messages in English

### French for User Interactions

- Claude Code responses in French
- Status updates and questions in French

### API Key Authentication

All protected routes use API key authentication via:

- `Authorization: Bearer chk_live_xxxxx`
- `X-API-Key: chk_live_xxxxx`

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Neon Database

### Branches

- **main**: Production database
- **dev**: Development/testing database

### Connection Strings

```bash
# Production (main)
DATABASE_URL=postgresql://neondb_owner:xxx@ep-muddy-rice-agl82ynd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Development (dev)
DATABASE_URL=postgresql://neondb_owner:xxx@ep-twilight-base-agvna57r-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

### Neon CLI Commands

```bash
# List branches
neonctl branches list --project-id jolly-queen-59157577

# Get connection string
neonctl connection-string --project-id jolly-queen-59157577 --branch dev --pooled
```

## Testing

### Bruno (API Testing)

API test collections in `/bruno` directory.

### Manual Testing

```bash
# Health check
curl http://localhost:3333/health

# Register
curl -X POST http://localhost:3333/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create board
curl -X POST http://localhost:3333/v1/boards \
  -H "Authorization: Bearer chk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","unitType":"boolean","emoji":"✅"}'
```

## Resources

- [AdonisJS Documentation](https://docs.adonisjs.com)
- [Lucid ORM Documentation](https://lucid.adonisjs.com)
- [Neon Documentation](https://neon.tech/docs)
- [Hugo Documentation](https://gohugo.io/documentation)

---

**Last Updated**: 2025-11-28
**Current Version**: 0.2.0 (API Backend)
**Architecture**: AdonisJS 6 + Neon PostgreSQL + API Key Auth
