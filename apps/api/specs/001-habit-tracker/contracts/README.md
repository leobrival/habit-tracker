# API Contracts - Habit Tracking Application

This directory contains the API contract specifications for all Convex backend functions (queries, mutations, actions).

## Contract Files

- **[auth.md](./auth.md)** - Authentication and user management
- **[boards.md](./boards.md)** - Board CRUD operations
- **[check-ins.md](./check-ins.md)** - Check-in operations
- **[analytics.md](./analytics.md)** - Analytics and statistics queries
- **[notifications.md](./notifications.md)** - Notification management

## Convex Function Types

### Queries (Read-only)

- Pure, deterministic functions
- Can be subscribed to for real-time updates
- Automatically cached and optimized by Convex
- Always return same result for same arguments

### Mutations (Write operations)

- Modify database state
- Transactional (atomic)
- Can trigger real-time updates to subscribed queries
- Return confirmation or created resource ID

### Actions (External operations)

- Call external APIs (e.g., send emails, push notifications)
- Non-deterministic
- Cannot be subscribed to
- Often called from mutations via `ctx.scheduler`

## Common Patterns

### Authentication

All functions requiring authentication check `ctx.auth.getUserIdentity()`:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) throw new Error("Unauthenticated");
```

### Error Handling

Functions throw descriptive errors:

```typescript
if (!board) throw new Error("Board not found");
if (board.userId !== identity.subject) throw new Error("Unauthorized");
```

### Pagination

Large result sets use Convex pagination:

```typescript
const results = await ctx.db
  .query("checkIns")
  .withIndex("by_board", (q) => q.eq("boardId", boardId))
  .paginate(paginationOpts);
```

## Contract Format

Each contract file follows this structure:

````markdown
## Function Name

**Type**: Query | Mutation | Action
**Auth Required**: Yes | No

### Arguments

| Parameter | Type | Required | Description | Validation |

### Returns

| Field | Type | Description |

### Errors

- Error condition → Error message

### Example Request/Response

```typescript
// Request
const result = await api.namespace.functionName.call({ ... });

// Response
{ ... }
```
````

### Implementation Notes

- Additional context, edge cases, performance considerations

```

## Type Safety

All contracts are implemented with full TypeScript type safety:
- Arguments defined with Convex validators (`v.*`)
- Return types inferred from implementation
- Convex auto-generates typed client API

## Testing

Each contract should have corresponding tests:
- Unit tests: Business logic validation
- Integration tests: Full workflow (e.g., create board → check in → verify streak)
- E2E tests: Critical user journeys via Playwright
```
