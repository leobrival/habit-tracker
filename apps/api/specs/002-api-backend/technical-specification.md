# Technical Specification: Checker API Backend

**Version**: 1.0.0
**Status**: Draft
**Created**: 2025-11-28
**Author**: Technical Architecture Team
**Feature Branch**: `002-api-backend`

---

## Table of Contents

1. [Introduction & Context](#1-introduction--context)
2. [System Architecture](#2-system-architecture)
3. [Database Schema Design](#3-database-schema-design)
4. [API Endpoints Specification](#4-api-endpoints-specification)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Rate Limiting Approach](#7-rate-limiting-approach)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Developer Handoff](#9-developer-handoff)

---

## 1. Introduction & Context

### 1.1 Project Overview

The Checker API Backend provides a RESTful API layer for the habit tracking application, designed specifically for programmatic access from external clients such as Raycast extensions, CLI tools, mobile applications, and third-party integrations.

This specification complements the existing Next.js web application by providing a dedicated API service with API key authentication, optimized for machine-to-machine communication.

### 1.2 Business Objectives

| Objective | Success Metric |
|-----------|----------------|
| Enable external integrations | 3+ integration types supported (Raycast, CLI, mobile) |
| Reduce friction for quick check-ins | Check-in time < 2 seconds via API |
| Maintain data consistency | 100% sync with web application data |
| Support developer ecosystem | API documentation with 95% coverage |

### 1.3 Scope Definition

**In Scope**:

- User management and authentication via API keys
- Full CRUD operations for habit boards
- Check-in recording and management
- Analytics and statistics endpoints
- Heatmap data generation
- Rate limiting and abuse prevention

**Out of Scope**:

- Real-time WebSocket connections (use polling or webhooks)
- OAuth provider management (handled by web app)
- Push notifications (handled by separate service)
- File uploads (not required for habit tracking)

### 1.4 Key Terms & Acronyms

| Term | Definition |
|------|------------|
| API Key | A secret token used to authenticate API requests |
| Board | A habit tracking container with name, unit type, and statistics |
| Check-in | A single habit completion event for a specific date |
| Streak | Consecutive days with at least one check-in |
| Heatmap | Visual representation of check-in frequency over time |
| Scope | Permission level granted to an API key |

### 1.5 Architecture Decision Records (ADRs)

#### ADR-001: AdonisJS 6 as Backend Framework

**Status**: Accepted

**Context**: Need a TypeScript-first Node.js framework with built-in ORM, validation, and authentication support.

**Decision**: Use AdonisJS 6 with Lucid ORM.

**Consequences**:

- (+) Full TypeScript support with strict typing
- (+) Lucid ORM provides ActiveRecord pattern familiar to Rails developers
- (+) Built-in validation, middleware, and testing support
- (+) Excellent documentation and active community
- (-) Smaller ecosystem compared to Express/NestJS
- (-) Learning curve for developers unfamiliar with AdonisJS

#### ADR-002: PostgreSQL via Neon for Database

**Status**: Accepted

**Context**: Need serverless-compatible PostgreSQL with branch support for development workflows.

**Decision**: Use Neon serverless PostgreSQL with main/dev branches.

**Consequences**:

- (+) Serverless scaling with pay-per-use pricing
- (+) Database branching enables safe development workflows
- (+) Compatible with standard PostgreSQL clients
- (+) Automatic backups and point-in-time recovery
- (-) Cold start latency for infrequently accessed databases
- (-) Connection pooling required for high concurrency

#### ADR-003: API Key Authentication over JWT

**Status**: Accepted

**Context**: External clients (Raycast, CLI) need persistent authentication without user interaction.

**Decision**: Implement API key authentication with scopes and expiration.

**Consequences**:

- (+) Simple integration for CLI tools and scripts
- (+) Keys can be revoked independently
- (+) Scoped permissions enable least-privilege access
- (+) No token refresh flow required
- (-) Keys must be stored securely by clients
- (-) No built-in session management

#### ADR-004: Hugo for API Documentation

**Status**: Accepted

**Context**: Need static documentation site that can be versioned with the codebase.

**Decision**: Use Hugo static site generator with custom API documentation theme.

**Consequences**:

- (+) Fast build times for documentation changes
- (+) Version control alongside code
- (+) Markdown-based content easy to maintain
- (+) Can host on any static hosting (Vercel, Netlify, GitHub Pages)
- (-) Custom theme development required
- (-) No interactive API testing built-in (use Postman/Insomnia)

---

## 2. System Architecture

### 2.1 System Context Diagram (C4 Level 1)

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|  Raycast Client  |     |   CLI Tool       |     |  Mobile App      |
|  (Extension)     |     |  (Terminal)      |     |  (Future)        |
|                  |     |                  |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         |    HTTPS/REST          |    HTTPS/REST          |    HTTPS/REST
         |    API Key Auth        |    API Key Auth        |    API Key Auth
         +------------------------+------------------------+
                                  |
                                  v
                    +-------------+-------------+
                    |                           |
                    |   Checker API Backend     |
                    |   (AdonisJS 6)            |
                    |                           |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |             |             |
                    v             v             v
          +---------+--+  +------+------+  +---+--------+
          |            |  |             |  |            |
          | PostgreSQL |  | Hugo Docs   |  | Web App    |
          | (Neon)     |  | (Static)    |  | (Next.js)  |
          |            |  |             |  |            |
          +------------+  +-------------+  +------------+
```

### 2.2 Container Diagram (C4 Level 2)

```
+-----------------------------------------------------------------------+
|                          Checker API Backend                           |
|                                                                        |
|  +------------------+    +------------------+    +------------------+  |
|  |                  |    |                  |    |                  |  |
|  |  HTTP Server     |    |  API Routes      |    |  Middleware      |  |
|  |  (AdonisJS)      |--->|  (Controllers)   |--->|  (Auth, Rate)    |  |
|  |                  |    |                  |    |                  |  |
|  +------------------+    +------------------+    +------------------+  |
|           |                       |                       |            |
|           v                       v                       v            |
|  +------------------+    +------------------+    +------------------+  |
|  |                  |    |                  |    |                  |  |
|  |  Services        |    |  Lucid Models    |    |  Validators      |  |
|  |  (Business Logic)|    |  (ORM Entities)  |    |  (Vine Schema)   |  |
|  |                  |    |                  |    |                  |  |
|  +------------------+    +------------------+    +------------------+  |
|                                  |                                     |
+----------------------------------+-------------------------------------+
                                   |
                                   v
                    +-------------+-------------+
                    |                           |
                    |   PostgreSQL (Neon)       |
                    |   - main branch (prod)    |
                    |   - dev branch (staging)  |
                    |                           |
                    +---------------------------+
```

### 2.3 Component Diagram (C4 Level 3)

```
+-----------------------------------------------------------------------+
|                           API Application                              |
|                                                                        |
|  +----------------------+  +----------------------+                    |
|  |   Auth Module        |  |   Users Module       |                    |
|  |   - ApiKeyGuard      |  |   - UsersController  |                    |
|  |   - AuthService      |  |   - UserService      |                    |
|  |   - ApiKey Model     |  |   - User Model       |                    |
|  +----------------------+  +----------------------+                    |
|                                                                        |
|  +----------------------+  +----------------------+                    |
|  |   Boards Module      |  |   Check-ins Module   |                    |
|  |   - BoardsController |  |   - CheckInsController|                   |
|  |   - BoardService     |  |   - CheckInService   |                    |
|  |   - Board Model      |  |   - CheckIn Model    |                    |
|  +----------------------+  +----------------------+                    |
|                                                                        |
|  +----------------------+  +----------------------+                    |
|  |   Analytics Module   |  |   Rate Limiter       |                    |
|  |   - AnalyticsController|  |   - RateLimitMiddleware|                |
|  |   - StreakService    |  |   - RateLimitService |                    |
|  |   - HeatmapService   |  |   - Redis Store      |                    |
|  +----------------------+  +----------------------+                    |
|                                                                        |
|  +---------------------------------------------------------------+    |
|  |                    Shared Services                             |    |
|  |  - Database (Lucid ORM)                                       |    |
|  |  - Logger (Pino)                                              |    |
|  |  - Cache (Redis/Memory)                                       |    |
|  |  - Validation (Vine)                                          |    |
|  +---------------------------------------------------------------+    |
|                                                                        |
+-----------------------------------------------------------------------+
```

### 2.4 Data Flow Diagram

```
Client Request Flow:
====================

1. Client sends HTTPS request with API key header
   |
   v
2. Rate Limiter checks request quota
   |
   +--[Exceeded]--> Return 429 Too Many Requests
   |
   v
3. API Key Guard validates key
   |
   +--[Invalid]---> Return 401 Unauthorized
   |
   v
4. Scope Guard checks permissions
   |
   +--[Forbidden]--> Return 403 Forbidden
   |
   v
5. Validator checks request body/params
   |
   +--[Invalid]---> Return 422 Unprocessable Entity
   |
   v
6. Controller invokes Service layer
   |
   v
7. Service performs business logic
   |
   v
8. Model interacts with PostgreSQL
   |
   v
9. Response serialized and returned
   |
   v
10. Client receives JSON response
```

---

## 3. Database Schema Design

### 3.1 Entity Relationship Diagram

```
+----------------+       +----------------+       +----------------+
|     users      |       |   api_keys     |       |    boards      |
+----------------+       +----------------+       +----------------+
| id (PK)        |<---+  | id (PK)        |  +--->| id (PK)        |
| email          |    |  | user_id (FK)   |--+    | user_id (FK)   |---+
| password_hash  |    |  | name           |       | name           |   |
| name           |    |  | key_hash       |       | description    |   |
| timezone       |    |  | key_prefix     |       | emoji          |   |
| theme          |    |  | scopes         |       | color          |   |
| created_at     |    |  | expires_at     |       | unit_type      |   |
| updated_at     |    |  | last_used_at   |       | unit           |   |
+----------------+    |  | is_revoked     |       | target_amount  |   |
                      |  | created_at     |       | current_streak |   |
                      |  +----------------+       | longest_streak |   |
                      |                           | total_check_ins|   |
                      |                           | is_archived    |   |
                      |                           | archived_at    |   |
                      |                           | last_check_in  |   |
                      |                           | created_at     |   |
                      |                           | updated_at     |   |
                      |                           +----------------+   |
                      |                                    |           |
                      |                                    v           |
                      |                           +----------------+   |
                      |                           |   check_ins    |   |
                      |                           +----------------+   |
                      +-------------------------->| id (PK)        |   |
                                                  | board_id (FK)  |<--+
                                                  | user_id (FK)   |
                                                  | date           |
                                                  | timestamp      |
                                                  | amount         |
                                                  | note           |
                                                  | session_number |
                                                  | created_at     |
                                                  +----------------+
```

### 3.2 Table Definitions

#### 3.2.1 users

Primary user accounts table (compatible with existing web app schema).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    name VARCHAR(100),
    image VARCHAR(500),
    password_hash VARCHAR(255),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    theme VARCHAR(10) DEFAULT 'system',
    notification_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

**Column Details**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| email_verified | TIMESTAMP | NULLABLE | Email verification timestamp |
| name | VARCHAR(100) | NULLABLE | Display name |
| image | VARCHAR(500) | NULLABLE | Profile image URL |
| password_hash | VARCHAR(255) | NULLABLE | Bcrypt hashed password |
| timezone | VARCHAR(50) | NOT NULL, DEFAULT 'UTC' | User timezone (IANA format) |
| theme | VARCHAR(10) | DEFAULT 'system' | UI theme preference |
| notification_settings | JSONB | DEFAULT '{}' | Notification preferences |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update time |

#### 3.2.2 api_keys

API keys for external client authentication.

```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(12) NOT NULL,
    scopes VARCHAR(255)[] NOT NULL DEFAULT ARRAY['read'],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_ip VARCHAR(45),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(user_id, is_revoked)
    WHERE is_revoked = FALSE;
```

**Column Details**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK -> users.id, ON DELETE CASCADE | Owner of the API key |
| name | VARCHAR(100) | NOT NULL | Human-readable key name |
| key_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of the key |
| key_prefix | VARCHAR(12) | NOT NULL | First 12 chars for identification |
| scopes | VARCHAR(255)[] | NOT NULL, DEFAULT ['read'] | Permission scopes |
| expires_at | TIMESTAMP | NULLABLE | Key expiration (null = never) |
| last_used_at | TIMESTAMP | NULLABLE | Last API call timestamp |
| last_used_ip | VARCHAR(45) | NULLABLE | Last client IP address |
| is_revoked | BOOLEAN | NOT NULL, DEFAULT FALSE | Revocation status |
| revoked_at | TIMESTAMP | NULLABLE | Revocation timestamp |
| created_at | TIMESTAMP | NOT NULL | Key creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

**Scopes Enum**:

```typescript
enum ApiKeyScope {
  READ = 'read',           // Read boards, check-ins, analytics
  WRITE = 'write',         // Create/update boards and check-ins
  DELETE = 'delete',       // Delete boards and check-ins
  ADMIN = 'admin',         // Manage API keys, user settings
}
```

#### 3.2.3 boards

Habit tracking boards/goals.

```sql
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    emoji VARCHAR(10) DEFAULT '📊',
    color VARCHAR(7) DEFAULT '#3B82F6',
    unit_type VARCHAR(20) NOT NULL,
    unit VARCHAR(20),
    target_amount DECIMAL(10, 2),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_check_ins INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    last_check_in_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT boards_name_per_user UNIQUE (user_id, name),
    CONSTRAINT boards_unit_type_check CHECK (
        unit_type IN ('boolean', 'time', 'distance', 'volume',
                      'mass', 'calories', 'money', 'percentage', 'custom')
    )
);

-- Indexes
CREATE INDEX idx_boards_user_id ON boards(user_id);
CREATE INDEX idx_boards_user_active ON boards(user_id, is_archived)
    WHERE is_archived = FALSE;
CREATE INDEX idx_boards_last_check_in ON boards(last_check_in_date DESC NULLS LAST);
```

**Column Details**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK -> users.id | Board owner |
| name | VARCHAR(50) | NOT NULL, UNIQUE per user | Board name |
| description | VARCHAR(500) | NULLABLE | Board description |
| emoji | VARCHAR(10) | DEFAULT '📊' | Display emoji |
| color | VARCHAR(7) | DEFAULT '#3B82F6' | Hex color code |
| unit_type | VARCHAR(20) | NOT NULL, CHECK constraint | Tracking unit type |
| unit | VARCHAR(20) | NULLABLE | Custom unit label |
| target_amount | DECIMAL(10,2) | NULLABLE | Daily target |
| current_streak | INTEGER | NOT NULL, DEFAULT 0 | Current consecutive days |
| longest_streak | INTEGER | NOT NULL, DEFAULT 0 | Record streak |
| total_check_ins | INTEGER | NOT NULL, DEFAULT 0 | Total check-in count |
| is_archived | BOOLEAN | NOT NULL, DEFAULT FALSE | Archive status |
| archived_at | TIMESTAMP | NULLABLE | Archive timestamp |
| last_check_in_date | DATE | NULLABLE | Most recent check-in date |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last update time |

#### 3.2.4 check_ins

Daily habit completion records.

```sql
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    amount DECIMAL(10, 2),
    note VARCHAR(500),
    session_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_ins_positive_amount CHECK (amount IS NULL OR amount >= 0),
    CONSTRAINT check_ins_session_positive CHECK (session_number > 0)
);

-- Indexes
CREATE INDEX idx_check_ins_board_id ON check_ins(board_id);
CREATE INDEX idx_check_ins_board_date ON check_ins(board_id, date);
CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date);
CREATE INDEX idx_check_ins_board_timestamp ON check_ins(board_id, timestamp DESC);

-- Composite index for streak calculations
CREATE INDEX idx_check_ins_streak_calc ON check_ins(board_id, date DESC);
```

**Column Details**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| board_id | UUID | FK -> boards.id | Parent board |
| user_id | UUID | FK -> users.id | Check-in owner |
| date | DATE | NOT NULL | Calendar date (user timezone) |
| timestamp | TIMESTAMP | NOT NULL | Exact check-in time |
| amount | DECIMAL(10,2) | NULLABLE, >= 0 | Quantity tracked |
| note | VARCHAR(500) | NULLABLE | Optional note |
| session_number | INTEGER | NOT NULL, DEFAULT 1, > 0 | Session within day |
| created_at | TIMESTAMP | NOT NULL | Record creation time |

### 3.3 Database Indexes Strategy

**Query Pattern Analysis**:

| Query Pattern | Frequency | Index Solution |
|---------------|-----------|----------------|
| Get user by email | High | `idx_users_email` |
| Get active boards for user | High | `idx_boards_user_active` (partial) |
| Get check-ins for board by date range | High | `idx_check_ins_board_date` |
| Calculate streak (recent dates) | High | `idx_check_ins_streak_calc` |
| Validate API key | High | `idx_api_keys_key_prefix` |
| Get active API keys for user | Medium | `idx_api_keys_active` (partial) |
| Get check-ins for heatmap (year) | Medium | `idx_check_ins_board_timestamp` |

**Partial Index Rationale**:

Partial indexes reduce storage and improve performance for filtered queries:

```sql
-- Only index non-revoked API keys
CREATE INDEX idx_api_keys_active ON api_keys(user_id, is_revoked)
    WHERE is_revoked = FALSE;

-- Only index active boards
CREATE INDEX idx_boards_user_active ON boards(user_id, is_archived)
    WHERE is_archived = FALSE;
```

### 3.4 Neon Branch Strategy

**Branch Configuration**:

| Branch | Environment | Purpose |
|--------|-------------|---------|
| main | Production | Live user data, read replicas enabled |
| dev | Staging | Integration testing, reset weekly |
| feature/* | Development | Ephemeral branches per feature |

**Branch Workflow**:

```
main (production)
  |
  +-- dev (staging)
       |
       +-- feature/api-keys (ephemeral)
       +-- feature/rate-limiting (ephemeral)
```

**Connection String Pattern**:

```bash
# Production
DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/checker

# Staging (dev branch)
DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/checker?options=project%3Ddev

# Feature branch
DATABASE_URL=postgres://user:pass@ep-xxx.us-east-2.aws.neon.tech/checker?options=project%3Dfeature-api-keys
```

---

## 4. API Endpoints Specification

### 4.1 API Design Principles

**Base URL**: `https://api.checker.app/v1`

**Conventions**:

- RESTful resource naming (plural nouns)
- JSON request/response bodies
- UUID for all resource identifiers
- ISO 8601 date/time formats
- Snake_case for JSON keys (PostgreSQL convention)
- Pagination via `cursor` and `limit` parameters
- Filtering via query parameters

### 4.2 Authentication Endpoints

#### POST /auth/register

Create a new user account.

**Request**:

```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "John Doe",
  "timezone": "America/New_York"
}
```

**Response (201 Created)**:

```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "timezone": "America/New_York",
      "created_at": "2025-11-28T10:30:00Z"
    },
    "api_key": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Default Key",
      "key": "chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456",
      "key_prefix": "chk_live_aBcD",
      "scopes": ["read", "write"],
      "expires_at": null
    }
  },
  "meta": {
    "message": "Account created successfully. Store your API key securely - it won't be shown again."
  }
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| email | Required, valid email format, unique |
| password | Required, min 8 chars, 1 uppercase, 1 number, 1 special |
| name | Optional, max 100 chars |
| timezone | Optional, valid IANA timezone, default UTC |

#### POST /auth/login

Authenticate and receive API key (for web-initiated flows).

**Request**:

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200 OK)**:

```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "timezone": "America/New_York"
    },
    "api_keys": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Default Key",
        "key_prefix": "chk_live_aBcD",
        "scopes": ["read", "write"],
        "last_used_at": "2025-11-27T15:45:00Z",
        "expires_at": null
      }
    ]
  }
}
```

### 4.3 API Key Management Endpoints

#### GET /api-keys

List all API keys for authenticated user.

**Request**:

```http
GET /v1/api-keys
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Raycast Extension",
      "key_prefix": "chk_live_aBcD",
      "scopes": ["read", "write"],
      "last_used_at": "2025-11-28T09:15:00Z",
      "last_used_ip": "192.168.1.100",
      "expires_at": null,
      "is_revoked": false,
      "created_at": "2025-11-01T10:00:00Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "CLI Tool",
      "key_prefix": "chk_live_xYzW",
      "scopes": ["read"],
      "last_used_at": "2025-11-25T14:30:00Z",
      "last_used_ip": "10.0.0.50",
      "expires_at": "2026-01-01T00:00:00Z",
      "is_revoked": false,
      "created_at": "2025-11-15T08:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

#### POST /api-keys

Create a new API key.

**Request**:

```http
POST /v1/api-keys
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "name": "Mobile App",
  "scopes": ["read", "write"],
  "expires_in_days": 365
}
```

**Response (201 Created)**:

```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "name": "Mobile App",
    "key": "chk_live_nEwKeY123456789012345678901234567890",
    "key_prefix": "chk_live_nEwK",
    "scopes": ["read", "write"],
    "expires_at": "2026-11-28T10:30:00Z",
    "created_at": "2025-11-28T10:30:00Z"
  },
  "meta": {
    "message": "API key created. Store securely - it won't be shown again."
  }
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| name | Required, max 100 chars |
| scopes | Required, array of valid scopes |
| expires_in_days | Optional, 1-3650 days, null for never |

#### DELETE /api-keys/:id

Revoke an API key.

**Request**:

```http
DELETE /v1/api-keys/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "CLI Tool",
    "is_revoked": true,
    "revoked_at": "2025-11-28T10:35:00Z"
  },
  "meta": {
    "message": "API key revoked successfully"
  }
}
```

### 4.4 Board Endpoints

#### GET /boards

List all boards for authenticated user.

**Request**:

```http
GET /v1/boards?archived=false&limit=20&cursor=abc123
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| archived | boolean | false | Include archived boards |
| limit | integer | 20 | Results per page (1-100) |
| cursor | string | null | Pagination cursor |

**Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440010",
      "name": "Morning Workout",
      "description": "Daily exercise routine",
      "emoji": "💪",
      "color": "#10B981",
      "unit_type": "time",
      "unit": "minutes",
      "target_amount": 30.00,
      "current_streak": 7,
      "longest_streak": 21,
      "total_check_ins": 145,
      "is_archived": false,
      "last_check_in_date": "2025-11-28",
      "created_at": "2025-06-15T08:00:00Z",
      "updated_at": "2025-11-28T07:30:00Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440011",
      "name": "Read Books",
      "description": "Track daily reading",
      "emoji": "📚",
      "color": "#8B5CF6",
      "unit_type": "time",
      "unit": "minutes",
      "target_amount": 20.00,
      "current_streak": 3,
      "longest_streak": 14,
      "total_check_ins": 89,
      "is_archived": false,
      "last_check_in_date": "2025-11-28",
      "created_at": "2025-07-01T10:00:00Z",
      "updated_at": "2025-11-28T21:15:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "has_more": true,
    "next_cursor": "eyJpZCI6ImFhMGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAxMSJ9"
  }
}
```

#### POST /boards

Create a new board.

**Request**:

```http
POST /v1/boards
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "name": "Meditation",
  "description": "Daily mindfulness practice",
  "emoji": "🧘",
  "color": "#06B6D4",
  "unit_type": "time",
  "unit": "minutes",
  "target_amount": 15
}
```

**Response (201 Created)**:

```json
{
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440012",
    "name": "Meditation",
    "description": "Daily mindfulness practice",
    "emoji": "🧘",
    "color": "#06B6D4",
    "unit_type": "time",
    "unit": "minutes",
    "target_amount": 15.00,
    "current_streak": 0,
    "longest_streak": 0,
    "total_check_ins": 0,
    "is_archived": false,
    "last_check_in_date": null,
    "created_at": "2025-11-28T10:45:00Z",
    "updated_at": "2025-11-28T10:45:00Z"
  }
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| name | Required, 1-50 chars, unique per user |
| description | Optional, max 500 chars |
| emoji | Optional, valid emoji, max 10 chars |
| color | Optional, valid hex color (#RRGGBB) |
| unit_type | Required, enum value |
| unit | Required if unit_type is 'custom', max 20 chars |
| target_amount | Optional, positive decimal |

#### GET /boards/:id

Get board details.

**Request**:

```http
GET /v1/boards/990e8400-e29b-41d4-a716-446655440010
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440010",
    "name": "Morning Workout",
    "description": "Daily exercise routine",
    "emoji": "💪",
    "color": "#10B981",
    "unit_type": "time",
    "unit": "minutes",
    "target_amount": 30.00,
    "current_streak": 7,
    "longest_streak": 21,
    "total_check_ins": 145,
    "is_archived": false,
    "last_check_in_date": "2025-11-28",
    "created_at": "2025-06-15T08:00:00Z",
    "updated_at": "2025-11-28T07:30:00Z",
    "stats": {
      "completion_rate_7d": 100.0,
      "completion_rate_30d": 86.7,
      "completion_rate_90d": 78.9,
      "average_amount": 32.5,
      "total_amount": 4712.5,
      "days_tracked": 145
    }
  }
}
```

#### PUT /boards/:id

Update a board.

**Request**:

```http
PUT /v1/boards/990e8400-e29b-41d4-a716-446655440010
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "name": "Morning Workout",
  "target_amount": 45
}
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440010",
    "name": "Morning Workout",
    "target_amount": 45.00,
    "updated_at": "2025-11-28T10:50:00Z"
  }
}
```

#### DELETE /boards/:id

Delete a board (permanent).

**Request**:

```http
DELETE /v1/boards/990e8400-e29b-41d4-a716-446655440010
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440010",
    "deleted": true
  },
  "meta": {
    "message": "Board and all check-ins permanently deleted"
  }
}
```

#### POST /boards/:id/archive

Archive a board.

**Request**:

```http
POST /v1/boards/990e8400-e29b-41d4-a716-446655440010/archive
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440010",
    "is_archived": true,
    "archived_at": "2025-11-28T10:55:00Z"
  }
}
```

#### POST /boards/:id/restore

Restore an archived board.

**Request**:

```http
POST /v1/boards/990e8400-e29b-41d4-a716-446655440010/restore
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440010",
    "is_archived": false,
    "archived_at": null
  }
}
```

### 4.5 Check-in Endpoints

#### GET /boards/:id/check-ins

List check-ins for a board.

**Request**:

```http
GET /v1/boards/990e8400-e29b-41d4-a716-446655440010/check-ins?start_date=2025-11-01&end_date=2025-11-30
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| start_date | date | 30 days ago | Start date (inclusive) |
| end_date | date | today | End date (inclusive) |
| limit | integer | 100 | Results per page (1-1000) |
| cursor | string | null | Pagination cursor |

**Response (200 OK)**:

```json
{
  "data": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440020",
      "board_id": "990e8400-e29b-41d4-a716-446655440010",
      "date": "2025-11-28",
      "timestamp": "2025-11-28T07:30:00Z",
      "amount": 35.00,
      "note": "Great morning session!",
      "session_number": 1,
      "created_at": "2025-11-28T07:30:00Z"
    },
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440021",
      "board_id": "990e8400-e29b-41d4-a716-446655440010",
      "date": "2025-11-27",
      "timestamp": "2025-11-27T06:45:00Z",
      "amount": 30.00,
      "note": null,
      "session_number": 1,
      "created_at": "2025-11-27T06:45:00Z"
    }
  ],
  "meta": {
    "total": 28,
    "has_more": false,
    "next_cursor": null
  }
}
```

#### POST /boards/:id/check-ins

Create a new check-in.

**Request**:

```http
POST /v1/boards/990e8400-e29b-41d4-a716-446655440010/check-ins
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "date": "2025-11-28",
  "amount": 40,
  "note": "Extended session today"
}
```

**Response (201 Created)**:

```json
{
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440022",
    "board_id": "990e8400-e29b-41d4-a716-446655440010",
    "date": "2025-11-28",
    "timestamp": "2025-11-28T11:00:00Z",
    "amount": 40.00,
    "note": "Extended session today",
    "session_number": 2,
    "created_at": "2025-11-28T11:00:00Z"
  },
  "meta": {
    "daily_stats": {
      "session_count": 2,
      "daily_total": 75.00,
      "target": 30.00,
      "target_reached": true
    },
    "streak_updated": true,
    "current_streak": 8
  }
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| date | Optional, defaults to today, cannot be future |
| amount | Optional for boolean type, required otherwise, >= 0 |
| note | Optional, max 500 chars |

#### GET /check-ins/:id

Get a specific check-in.

**Request**:

```http
GET /v1/check-ins/cc0e8400-e29b-41d4-a716-446655440020
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440020",
    "board_id": "990e8400-e29b-41d4-a716-446655440010",
    "date": "2025-11-28",
    "timestamp": "2025-11-28T07:30:00Z",
    "amount": 35.00,
    "note": "Great morning session!",
    "session_number": 1,
    "created_at": "2025-11-28T07:30:00Z"
  }
}
```

#### PUT /check-ins/:id

Update a check-in.

**Request**:

```http
PUT /v1/check-ins/cc0e8400-e29b-41d4-a716-446655440020
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "amount": 45,
  "note": "Updated: actually did 45 minutes"
}
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440020",
    "amount": 45.00,
    "note": "Updated: actually did 45 minutes",
    "updated_at": "2025-11-28T11:05:00Z"
  },
  "meta": {
    "daily_stats": {
      "session_count": 2,
      "daily_total": 85.00,
      "target": 30.00,
      "target_reached": true
    }
  }
}
```

#### DELETE /check-ins/:id

Delete a check-in.

**Request**:

```http
DELETE /v1/check-ins/cc0e8400-e29b-41d4-a716-446655440020
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "cc0e8400-e29b-41d4-a716-446655440020",
    "deleted": true
  },
  "meta": {
    "streak_updated": true,
    "current_streak": 7,
    "message": "Check-in deleted, statistics recalculated"
  }
}
```

### 4.6 Analytics Endpoints

#### GET /boards/:id/heatmap

Get heatmap data for a board.

**Request**:

```http
GET /v1/boards/990e8400-e29b-41d4-a716-446655440010/heatmap?year=2025
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| year | integer | current year | Year to generate heatmap for |

**Response (200 OK)**:

```json
{
  "data": {
    "year": 2025,
    "board_id": "990e8400-e29b-41d4-a716-446655440010",
    "target_amount": 30.00,
    "cells": [
      {
        "date": "2025-01-01",
        "count": 1,
        "total": 32.00,
        "target_reached": true,
        "sessions": 1
      },
      {
        "date": "2025-01-02",
        "count": 0,
        "total": 0,
        "target_reached": false,
        "sessions": 0
      },
      {
        "date": "2025-01-03",
        "count": 2,
        "total": 65.00,
        "target_reached": true,
        "sessions": 2
      }
    ],
    "summary": {
      "total_days_tracked": 145,
      "total_amount": 4712.50,
      "days_target_reached": 128,
      "average_per_day": 32.50
    }
  }
}
```

#### GET /boards/:id/stats

Get detailed statistics for a board.

**Request**:

```http
GET /v1/boards/990e8400-e29b-41d4-a716-446655440010/stats
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "board_id": "990e8400-e29b-41d4-a716-446655440010",
    "streaks": {
      "current": 7,
      "longest": 21,
      "average": 8.5
    },
    "completion_rates": {
      "7_days": {
        "completed": 7,
        "total": 7,
        "rate": 100.0
      },
      "30_days": {
        "completed": 26,
        "total": 30,
        "rate": 86.7
      },
      "90_days": {
        "completed": 71,
        "total": 90,
        "rate": 78.9
      }
    },
    "amounts": {
      "total": 4712.50,
      "average": 32.50,
      "min": 15.00,
      "max": 90.00,
      "target": 30.00,
      "days_above_target": 128,
      "days_below_target": 17
    },
    "patterns": {
      "best_day": "Monday",
      "worst_day": "Saturday",
      "best_time": "07:00-08:00",
      "average_sessions_per_day": 1.2
    },
    "calculated_at": "2025-11-28T11:10:00Z"
  }
}
```

#### GET /users/me/dashboard

Get aggregated dashboard statistics.

**Request**:

```http
GET /v1/users/me/dashboard
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "summary": {
      "total_boards": 5,
      "active_boards": 4,
      "archived_boards": 1,
      "total_check_ins_today": 3,
      "total_check_ins_week": 18,
      "total_check_ins_all_time": 892
    },
    "boards_overview": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440010",
        "name": "Morning Workout",
        "emoji": "💪",
        "current_streak": 7,
        "checked_in_today": true,
        "last_check_in": "2025-11-28T07:30:00Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440011",
        "name": "Read Books",
        "emoji": "📚",
        "current_streak": 3,
        "checked_in_today": true,
        "last_check_in": "2025-11-28T21:15:00Z"
      }
    ],
    "today_progress": {
      "boards_completed": 3,
      "boards_remaining": 1,
      "completion_percentage": 75.0
    }
  }
}
```

### 4.7 User Profile Endpoints

#### GET /users/me

Get current user profile.

**Request**:

```http
GET /v1/users/me
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg",
    "timezone": "America/New_York",
    "theme": "dark",
    "notification_settings": {
      "email_digest": true,
      "push_reminders": true
    },
    "created_at": "2025-06-01T10:00:00Z",
    "updated_at": "2025-11-28T11:00:00Z"
  }
}
```

#### PUT /users/me

Update user profile.

**Request**:

```http
PUT /v1/users/me
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "name": "John D.",
  "timezone": "Europe/Paris",
  "theme": "light"
}
```

**Response (200 OK)**:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John D.",
    "timezone": "Europe/Paris",
    "theme": "light",
    "updated_at": "2025-11-28T11:15:00Z"
  }
}
```

#### DELETE /users/me

Delete user account and all data.

**Request**:

```http
DELETE /v1/users/me
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response (200 OK)**:

```json
{
  "data": {
    "deleted": true
  },
  "meta": {
    "message": "Account and all associated data permanently deleted"
  }
}
```

### 4.8 Quick Actions Endpoints

Optimized endpoints for CLI and Raycast integrations.

#### POST /quick/check-in

Quick check-in with board name lookup.

**Request**:

```http
POST /v1/quick/check-in
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
Content-Type: application/json

{
  "board_name": "Morning Workout",
  "amount": 30
}
```

**Response (201 Created)**:

```json
{
  "data": {
    "check_in_id": "ff0e8400-e29b-41d4-a716-446655440030",
    "board": {
      "id": "990e8400-e29b-41d4-a716-446655440010",
      "name": "Morning Workout",
      "emoji": "💪"
    },
    "amount": 30.00,
    "session_number": 1,
    "current_streak": 8,
    "target_reached": true
  }
}
```

#### GET /quick/status

Get quick status of all active boards.

**Request**:

```http
GET /v1/quick/status
Authorization: Bearer chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

**Response (200 OK)**:

```json
{
  "data": {
    "today": "2025-11-28",
    "boards": [
      {
        "name": "Morning Workout",
        "emoji": "💪",
        "checked_in": true,
        "current_streak": 8,
        "daily_total": 30.00,
        "target": 30.00
      },
      {
        "name": "Read Books",
        "emoji": "📚",
        "checked_in": false,
        "current_streak": 3,
        "daily_total": 0,
        "target": 20.00
      }
    ],
    "summary": {
      "completed": 1,
      "remaining": 1
    }
  }
}
```

---

## 5. Authentication & Authorization

### 5.1 API Key Format

**Key Structure**:

```
chk_[environment]_[random_string]

Examples:
- Production: chk_live_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789012
- Development: chk_test_xYzWvUtSrQpOnMlKjIhGfEdCbA098765432109
```

**Key Generation**:

```typescript
// Generate cryptographically secure API key
function generateApiKey(environment: 'live' | 'test'): {
  key: string;
  hash: string;
  prefix: string;
} {
  const randomPart = crypto.randomBytes(32).toString('base64url');
  const key = `chk_${environment}_${randomPart}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 12);

  return { key, hash, prefix };
}
```

### 5.2 API Key Validation Flow

```
Request with Authorization header
              |
              v
+-------------+-------------+
|  Extract key from header  |
|  (Bearer or X-API-Key)    |
+-------------+-------------+
              |
              v
+-------------+-------------+
|  Extract prefix (12 chars)|
|  Query api_keys by prefix |
+-------------+-------------+
              |
              v
+-------------+-------------+
|  Hash provided key        |
|  Compare with stored hash |
+-------------+-------------+
              |
    +---------+---------+
    |                   |
    v                   v
 [Match]            [No Match]
    |                   |
    v                   v
+---+---+         +-----+-----+
| Check |         | Return 401|
| expiry|         | Unauthorized|
+---+---+         +-----------+
    |
    +------+------+
    |             |
    v             v
 [Valid]       [Expired]
    |             |
    v             v
+---+---+    +----+----+
| Check |    | Return  |
| revoked|   | 401     |
+---+---+    +---------+
    |
    +------+------+
    |             |
    v             v
 [Active]     [Revoked]
    |             |
    v             v
+---+---+    +----+----+
| Update|    | Return  |
| usage |    | 401     |
+---+---+    +---------+
    |
    v
+---+---+
| Allow |
| request|
+-------+
```

### 5.3 Scope-Based Authorization

**Available Scopes**:

| Scope | Permissions |
|-------|-------------|
| `read` | GET endpoints (boards, check-ins, analytics, profile) |
| `write` | POST, PUT endpoints (create/update boards, check-ins) |
| `delete` | DELETE endpoints (remove boards, check-ins) |
| `admin` | API key management, account deletion |

**Scope Inheritance**:

```
admin
  |
  +-- delete
       |
       +-- write
            |
            +-- read
```

**Endpoint Scope Requirements**:

| Endpoint | Required Scope |
|----------|---------------|
| GET /boards | read |
| POST /boards | write |
| DELETE /boards/:id | delete |
| GET /api-keys | admin |
| POST /api-keys | admin |
| DELETE /api-keys/:id | admin |
| DELETE /users/me | admin |

### 5.4 Authentication Middleware

```typescript
// app/middleware/api_key_auth_middleware.ts
import { HttpContext } from '@adonisjs/core/http';
import ApiKey from '#models/api_key';
import { createHash } from 'node:crypto';

export default class ApiKeyAuthMiddleware {
  async handle(ctx: HttpContext, next: () => Promise<void>, scopes: string[] = ['read']) {
    const authHeader = ctx.request.header('Authorization');
    const apiKeyHeader = ctx.request.header('X-API-Key');

    const key = this.extractKey(authHeader, apiKeyHeader);

    if (!key) {
      return ctx.response.unauthorized({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required. Provide via Authorization: Bearer <key> or X-API-Key header.'
        }
      });
    }

    const keyPrefix = key.substring(0, 12);
    const keyHash = createHash('sha256').update(key).digest('hex');

    const apiKey = await ApiKey.query()
      .where('key_prefix', keyPrefix)
      .where('key_hash', keyHash)
      .where('is_revoked', false)
      .preload('user')
      .first();

    if (!apiKey) {
      return ctx.response.unauthorized({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or revoked API key.'
        }
      });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return ctx.response.unauthorized({
        error: {
          code: 'EXPIRED_API_KEY',
          message: 'API key has expired. Generate a new key.'
        }
      });
    }

    // Check scopes
    const hasRequiredScopes = scopes.every(scope =>
      apiKey.scopes.includes(scope) || apiKey.scopes.includes('admin')
    );

    if (!hasRequiredScopes) {
      return ctx.response.forbidden({
        error: {
          code: 'INSUFFICIENT_SCOPE',
          message: `This action requires scope(s): ${scopes.join(', ')}`
        }
      });
    }

    // Update last used
    await apiKey.merge({
      lastUsedAt: new Date(),
      lastUsedIp: ctx.request.ip()
    }).save();

    // Attach to context
    ctx.auth = { user: apiKey.user, apiKey };

    await next();
  }

  private extractKey(authHeader?: string, apiKeyHeader?: string): string | null {
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
```

### 5.5 Password Security

**Hashing Algorithm**: bcrypt with cost factor 12

```typescript
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Password Requirements**:

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

---

## 6. Error Handling Strategy

### 6.1 Error Response Format

**Standard Error Response**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided data is invalid.",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "rule": "required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "rule": "minLength"
      }
    ],
    "request_id": "req_abc123xyz789",
    "timestamp": "2025-11-28T11:30:00Z"
  }
}
```

### 6.2 Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | BAD_REQUEST | Malformed request syntax |
| 400 | INVALID_JSON | Request body is not valid JSON |
| 401 | MISSING_API_KEY | No API key provided |
| 401 | INVALID_API_KEY | API key not found or wrong |
| 401 | EXPIRED_API_KEY | API key has expired |
| 401 | REVOKED_API_KEY | API key was revoked |
| 401 | INVALID_CREDENTIALS | Wrong email or password |
| 403 | INSUFFICIENT_SCOPE | API key lacks required scope |
| 403 | RESOURCE_FORBIDDEN | User cannot access this resource |
| 404 | RESOURCE_NOT_FOUND | Requested resource does not exist |
| 404 | BOARD_NOT_FOUND | Board with given ID not found |
| 404 | CHECK_IN_NOT_FOUND | Check-in with given ID not found |
| 409 | DUPLICATE_RESOURCE | Resource already exists |
| 409 | DUPLICATE_BOARD_NAME | Board name already exists for user |
| 422 | VALIDATION_ERROR | Request data failed validation |
| 422 | FUTURE_DATE | Check-in date cannot be in future |
| 422 | INVALID_UNIT_TYPE | Unit type not in allowed values |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 503 | SERVICE_UNAVAILABLE | Database or service unavailable |

### 6.3 Exception Handler

```typescript
// app/exceptions/handler.ts
import { ExceptionHandler, HttpContext } from '@adonisjs/core/http';
import { errors as vineErrors } from '@vinejs/vine';

export default class AppExceptionHandler extends ExceptionHandler {
  protected debug = process.env.NODE_ENV === 'development';

  async handle(error: unknown, ctx: HttpContext) {
    const requestId = ctx.request.id();
    const timestamp = new Date().toISOString();

    // Validation errors
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The provided data is invalid.',
          details: error.messages.map(msg => ({
            field: msg.field,
            message: msg.message,
            rule: msg.rule
          })),
          request_id: requestId,
          timestamp
        }
      });
    }

    // Not found errors
    if (error.code === 'E_ROW_NOT_FOUND') {
      return ctx.response.status(404).json({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
          request_id: requestId,
          timestamp
        }
      });
    }

    // Rate limit errors
    if (error.code === 'E_RATE_LIMIT_EXCEEDED') {
      return ctx.response.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retry_after: error.retryAfter,
          request_id: requestId,
          timestamp
        }
      });
    }

    // Database errors
    if (error.code === '23505') { // Unique violation
      return ctx.response.status(409).json({
        error: {
          code: 'DUPLICATE_RESOURCE',
          message: 'A resource with this identifier already exists.',
          request_id: requestId,
          timestamp
        }
      });
    }

    // Log unexpected errors
    console.error('Unhandled error:', error);

    // Generic server error
    return ctx.response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: this.debug
          ? error.message
          : 'An unexpected error occurred. Please try again.',
        ...(this.debug && { stack: error.stack }),
        request_id: requestId,
        timestamp
      }
    });
  }
}
```

### 6.4 Logging Strategy

**Log Levels**:

| Level | Usage |
|-------|-------|
| ERROR | Exceptions, database failures, external service errors |
| WARN | Deprecated API usage, approaching rate limits, recoverable errors |
| INFO | API requests, authentication events, business operations |
| DEBUG | Detailed execution flow (development only) |

**Log Format** (JSON):

```json
{
  "level": "info",
  "timestamp": "2025-11-28T11:30:00.123Z",
  "request_id": "req_abc123xyz789",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/v1/boards/990e8400/check-ins",
  "status": 201,
  "duration_ms": 45,
  "ip": "192.168.1.100",
  "user_agent": "Raycast/1.0"
}
```

---

## 7. Rate Limiting Approach

### 7.1 Rate Limit Tiers

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 60 | 1,000 | 10,000 |
| Pro | 300 | 5,000 | 50,000 |
| Enterprise | 1,000 | 20,000 | Unlimited |

### 7.2 Rate Limit Headers

**Response Headers**:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1732793460
X-RateLimit-Reset-After: 35
```

### 7.3 Rate Limit Response

**429 Too Many Requests**:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please wait before making more requests.",
    "retry_after": 35,
    "limit": 60,
    "reset_at": "2025-11-28T11:31:00Z"
  }
}
```

### 7.4 Rate Limiting Implementation

**Sliding Window Algorithm**:

```typescript
// app/middleware/rate_limit_middleware.ts
import { HttpContext } from '@adonisjs/core/http';
import redis from '@adonisjs/redis/services/main';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export default class RateLimitMiddleware {
  private config: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'ratelimit:'
  };

  async handle(ctx: HttpContext, next: () => Promise<void>) {
    const identifier = this.getIdentifier(ctx);
    const key = `${this.config.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old entries and count current window
    await redis.zremrangebyscore(key, 0, windowStart);
    const requestCount = await redis.zcard(key);

    // Set headers
    ctx.response.header('X-RateLimit-Limit', this.config.maxRequests.toString());
    ctx.response.header('X-RateLimit-Remaining',
      Math.max(0, this.config.maxRequests - requestCount - 1).toString());
    ctx.response.header('X-RateLimit-Reset',
      Math.ceil((now + this.config.windowMs) / 1000).toString());

    if (requestCount >= this.config.maxRequests) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetAfter = oldestRequest.length > 1
        ? Math.ceil((parseInt(oldestRequest[1]) + this.config.windowMs - now) / 1000)
        : Math.ceil(this.config.windowMs / 1000);

      ctx.response.header('X-RateLimit-Reset-After', resetAfter.toString());
      ctx.response.header('Retry-After', resetAfter.toString());

      return ctx.response.tooManyRequests({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please wait before making more requests.',
          retry_after: resetAfter,
          limit: this.config.maxRequests,
          reset_at: new Date(now + resetAfter * 1000).toISOString()
        }
      });
    }

    // Add current request
    await redis.zadd(key, now, `${now}:${Math.random()}`);
    await redis.expire(key, Math.ceil(this.config.windowMs / 1000) + 1);

    await next();
  }

  private getIdentifier(ctx: HttpContext): string {
    // Use API key if authenticated, otherwise IP
    const apiKey = ctx.auth?.apiKey;
    if (apiKey) {
      return `key:${apiKey.id}`;
    }
    return `ip:${ctx.request.ip()}`;
  }
}
```

### 7.5 Endpoint-Specific Limits

| Endpoint Category | Limit | Reason |
|-------------------|-------|--------|
| POST /auth/register | 5/hour/IP | Prevent mass account creation |
| POST /auth/login | 10/minute/IP | Prevent brute force |
| POST /boards/:id/check-ins | 100/minute | Normal usage pattern |
| GET /boards/:id/heatmap | 30/minute | Expensive computation |
| DELETE /users/me | 1/day | Irreversible action |

---

## 8. Non-Functional Requirements

### 8.1 Performance Standards

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p50) | < 100ms | Application Performance Monitoring |
| API Response Time (p95) | < 300ms | Application Performance Monitoring |
| API Response Time (p99) | < 500ms | Application Performance Monitoring |
| Database Query Time (p95) | < 50ms | Query logging |
| Throughput | 1000 req/sec | Load testing |
| Error Rate | < 0.1% | Error tracking |

### 8.2 Availability

| Metric | Target |
|--------|--------|
| Uptime SLA | 99.9% (8.76 hours downtime/year) |
| Recovery Time Objective (RTO) | < 1 hour |
| Recovery Point Objective (RPO) | < 5 minutes |

### 8.3 Security Requirements

**Data Protection**:

- All data encrypted at rest (AES-256)
- All connections encrypted in transit (TLS 1.3)
- API keys stored as SHA-256 hashes
- Passwords stored as bcrypt hashes (cost 12)
- PII logged only at DEBUG level (disabled in production)

**Access Control**:

- Scope-based API key permissions
- Resource-level authorization (users can only access own data)
- Rate limiting per API key and IP
- API key expiration and revocation support

**Audit Logging**:

- All authentication events logged
- All data modification events logged
- Logs retained for 90 days
- Logs searchable by request_id, user_id, timestamp

### 8.4 Scalability

**Horizontal Scaling**:

- Stateless API servers (can scale to N instances)
- Database connection pooling via PgBouncer
- Redis cluster for rate limiting and caching
- CDN for static documentation

**Database Scaling**:

- Neon autoscaling (0.25 to 8 vCPUs)
- Read replicas for analytics queries
- Query optimization with EXPLAIN ANALYZE
- Index monitoring and optimization

### 8.5 Monitoring & Observability

**Health Check Endpoint**:

```http
GET /health

{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-11-28T12:00:00Z",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

**Metrics to Track**:

- Request count by endpoint, status, method
- Response time histograms
- Error rates by type
- Active API keys count
- Database connection pool utilization
- Redis memory usage

---

## 9. Developer Handoff

### 9.1 Project Structure

```
checker-api/
├── app/
│   ├── controllers/
│   │   ├── auth_controller.ts
│   │   ├── api_keys_controller.ts
│   │   ├── boards_controller.ts
│   │   ├── check_ins_controller.ts
│   │   ├── analytics_controller.ts
│   │   └── users_controller.ts
│   ├── middleware/
│   │   ├── api_key_auth_middleware.ts
│   │   ├── rate_limit_middleware.ts
│   │   └── scope_guard_middleware.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── api_key.ts
│   │   ├── board.ts
│   │   └── check_in.ts
│   ├── services/
│   │   ├── auth_service.ts
│   │   ├── board_service.ts
│   │   ├── check_in_service.ts
│   │   ├── streak_service.ts
│   │   └── heatmap_service.ts
│   ├── validators/
│   │   ├── auth_validator.ts
│   │   ├── board_validator.ts
│   │   └── check_in_validator.ts
│   └── exceptions/
│       └── handler.ts
├── config/
│   ├── app.ts
│   ├── database.ts
│   ├── redis.ts
│   └── cors.ts
├── database/
│   ├── migrations/
│   │   ├── 001_create_users_table.ts
│   │   ├── 002_create_api_keys_table.ts
│   │   ├── 003_create_boards_table.ts
│   │   └── 004_create_check_ins_table.ts
│   └── seeders/
│       └── test_data_seeder.ts
├── start/
│   ├── routes.ts
│   ├── kernel.ts
│   └── events.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── validators/
│   └── functional/
│       ├── auth.spec.ts
│       ├── boards.spec.ts
│       └── check_ins.spec.ts
├── docs/                          # Hugo documentation site
│   ├── content/
│   │   ├── _index.md
│   │   ├── authentication/
│   │   ├── boards/
│   │   ├── check-ins/
│   │   └── analytics/
│   └── config.toml
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 9.2 Environment Variables

```bash
# .env.example

# Application
NODE_ENV=development
PORT=3333
APP_KEY=<generate-with-node-ace-generate-key>
HOST=0.0.0.0
LOG_LEVEL=info

# Database (Neon)
DATABASE_URL=postgres://user:password@ep-xxx.us-east-2.aws.neon.tech/checker
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API Keys
API_KEY_PREFIX=chk
API_KEY_HASH_ALGORITHM=sha256

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# CORS
CORS_ORIGIN=https://checker.app,https://api.checker.app
```

### 9.3 Setup Instructions

```bash
# 1. Clone repository
git clone https://github.com/your-org/checker-api.git
cd checker-api

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Generate app key
node ace generate:key

# 5. Configure database URL in .env

# 6. Run migrations
node ace migration:run

# 7. (Optional) Seed test data
node ace db:seed

# 8. Start development server
npm run dev

# 9. Run tests
npm test
```

### 9.4 API Documentation Deployment

```bash
# Build Hugo documentation
cd docs
hugo --minify

# Deploy to Vercel
vercel deploy --prod

# Or build and serve locally
hugo server -D
```

### 9.5 Testing Strategy

**Unit Tests**:

- Service layer business logic
- Validator schemas
- Utility functions
- Streak calculation algorithms

**Integration Tests**:

- Database operations
- API endpoint flows
- Authentication middleware
- Rate limiting behavior

**Test Coverage Target**: 80%+

### 9.6 Deployment Checklist

**Pre-Deployment**:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations reviewed
- [ ] API documentation updated
- [ ] Rate limits configured
- [ ] CORS origins updated
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring dashboards ready

**Post-Deployment**:

- [ ] Health check endpoint responding
- [ ] Sample API calls successful
- [ ] Logs flowing to monitoring
- [ ] Alerts configured
- [ ] Documentation site accessible

---

## Appendix A: API Reference Quick Guide

### Authentication

```bash
# Register
curl -X POST https://api.checker.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecureP@ss123"}'

# All other requests use API key
curl https://api.checker.app/v1/boards \
  -H "Authorization: Bearer chk_live_your_api_key"
```

### Common Operations

```bash
# List boards
curl https://api.checker.app/v1/boards \
  -H "Authorization: Bearer $API_KEY"

# Create check-in
curl -X POST https://api.checker.app/v1/boards/{id}/check-ins \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 30}'

# Quick check-in by name
curl -X POST https://api.checker.app/v1/quick/check-in \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"board_name": "Morning Workout", "amount": 30}'

# Get heatmap
curl https://api.checker.app/v1/boards/{id}/heatmap?year=2025 \
  -H "Authorization: Bearer $API_KEY"
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| API Key | Secret token for authenticating API requests |
| Board | Container for tracking a single habit |
| Check-in | Single completion event for a habit |
| Heatmap | Visual calendar showing activity intensity |
| Scope | Permission level granted to an API key |
| Session | Individual check-in within a single day |
| Streak | Count of consecutive days with check-ins |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-28 | Tech Specs | Initial specification |

---

**End of Technical Specification**
