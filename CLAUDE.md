# CLAUDE.md - Habit Tracker Monorepo

## Project Overview

**Habit Tracker** is a monorepo containing a complete habit tracking ecosystem:

- **API**: AdonisJS 6 backend with PostgreSQL (Neon)
- **Web**: Dashboard application with Inertia.js + React
- **Landing**: Marketing landing page with Next.js
- **Raycast Extension**: Quick habit check-ins from Raycast
- **MCP Server**: Model Context Protocol server for Claude integration

## Technology Stack

### Backend (apps/api)

- **AdonisJS 6** - TypeScript-first Node.js framework
- **Lucid ORM** - Active Record ORM
- **Neon PostgreSQL** - Serverless PostgreSQL
- **VineJS** - Request validation

### Web App (apps/web)

- **AdonisJS 6** - Server framework
- **Inertia.js** - SPA without API
- **React 19** - UI library
- **Tailwind CSS 4** - Styling

### Landing Page (apps/landing)

- **Next.js 15** - React framework
- **React 19** - UI library
- **Tailwind CSS 4** - Styling

### Extension (extensions/raycast)

- **Raycast API** - Extension framework
- **TypeScript** - Type safety

### MCP Server (packages/mcp-server)

- **MCP SDK** - Model Context Protocol
- **Zod** - Schema validation

## Project Structure

```
habit-tracker/
├── apps/
│   ├── api/                 # AdonisJS API (Port: 3333)
│   ├── web/                 # Inertia.js Dashboard (Port: 3001)
│   └── landing/             # Next.js Landing (Port: 3000)
├── packages/
│   ├── shared/              # Shared TypeScript types
│   └── mcp-server/          # MCP Server for Claude
├── extensions/
│   └── raycast/             # Raycast Extension
├── package.json             # pnpm workspace root
├── pnpm-workspace.yaml      # Workspace configuration
├── turbo.json               # Turborepo configuration
└── biome.json               # Linter/Formatter
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (all apps)
pnpm dev

# Development (specific app)
pnpm dev:api          # API on :3333
pnpm dev:web          # Web on :3001
pnpm dev:landing      # Landing on :3000

# Build all
pnpm build

# Lint and format
pnpm lint
pnpm format

# Type checking
pnpm typecheck
```

## Database (Neon)

- **Project**: habit-tracker (jolly-queen-59157577)
- **Region**: aws-eu-central-1
- **Branches**: main (production), dev (development)

### Neon CLI

```bash
# List branches
neonctl branches list --project-id jolly-queen-59157577

# Get connection string
neonctl connection-string --project-id jolly-queen-59157577 --branch dev --pooled
```

## API Endpoints

### Authentication

```
POST /v1/auth/register     # Create account
POST /v1/auth/login        # Authenticate
```

### Boards (Protected)

```
GET    /v1/boards              # List boards
POST   /v1/boards              # Create board
GET    /v1/boards/:id          # Get board
PUT    /v1/boards/:id          # Update board
DELETE /v1/boards/:id          # Delete board
GET    /v1/boards/:id/stats    # Get statistics
GET    /v1/boards/:id/heatmap  # Get heatmap data
```

### Check-ins (Protected)

```
GET    /v1/boards/:id/check-ins   # List check-ins
POST   /v1/boards/:id/check-ins   # Create check-in
POST   /v1/quick/check-in         # Quick check-in
GET    /v1/quick/status           # Today's status
```

## MCP Server

The MCP server enables Claude to interact with the Habit Tracker API.

### Configuration

Add to Claude Code's MCP configuration:

```json
{
  "mcpServers": {
    "checker": {
      "command": "node",
      "args": ["packages/mcp-server/dist/index.js"],
      "env": {
        "CHECKER_API_URL": "http://localhost:3333",
        "CHECKER_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Available Tools

- `checker_list_boards` - List all habit boards
- `checker_create_board` - Create a new board
- `checker_get_board` - Get board details
- `checker_update_board` - Update a board
- `checker_delete_board` - Delete a board
- `checker_quick_checkin` - Quick check-in
- `checker_quick_status` - Today's status
- `checker_list_checkins` - List check-ins
- `checker_create_checkin` - Create check-in
- `checker_get_stats` - Get board statistics
- `checker_get_heatmap` - Get heatmap data
- `checker_get_profile` - Get user profile

## Raycast Extension

### Commands

- **Quick Check-in**: Quickly check in to a habit
- **List Boards**: View all habit boards
- **Today's Status**: View today's progress

### Setup

1. Open Raycast preferences
2. Add extension from `extensions/raycast`
3. Configure API key and URL

## Code Conventions

### Language Policy

- **Code/Docs/Logs**: English only
- **User Interactions**: French (Claude responses)

### Linting

- **Biome** for TypeScript/JavaScript
- **Tabs** for indentation
- **Double quotes** for strings

### Commit Messages

- Commitizen format (feat:, fix:, chore:, etc.)
- English only
- One-line messages

## Environment Variables

### API (apps/api/.env)

```bash
DATABASE_URL=postgresql://...
APP_KEY=<random-32-char>
PORT=3333
HOST=localhost
NODE_ENV=development
```

### Web (apps/web/.env)

```bash
APP_KEY=<random-32-char>
PORT=3001
HOST=localhost
NODE_ENV=development
SESSION_DRIVER=cookie
```

## Resources

- [AdonisJS Documentation](https://docs.adonisjs.com)
- [Inertia.js Documentation](https://inertiajs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Raycast Documentation](https://developers.raycast.com)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Neon Documentation](https://neon.tech/docs)

---

**Last Updated**: 2025-11-28
**Version**: 0.1.0
