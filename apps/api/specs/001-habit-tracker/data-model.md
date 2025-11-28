# Data Model: Habit Tracking Application

**Feature**: 001-habit-tracker
**Date**: 2025-11-28
**Database**: PostgreSQL (Neon)

## Overview

This document defines the database schema, entities, relationships, and validation rules for the Habit Tracking Application. The data model is designed for PostgreSQL via Neon, with Drizzle ORM for type-safe queries and automatic TypeScript type generation.

---

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│     boards      │
└──────┬──────────┘
       │ 1
       │
       │ N
┌──────┴──────────┐
│    check_ins    │
└─────────────────┘

┌─────────────┐
│    users    │────┐
└──────┬──────┘    │ N
       │           │
       │ N         │
┌──────┴──────────┐│
│    insights     ││
└─────────────────┘│
       │ N         │
┌──────┴──────────┐│
│  notifications  ││
└─────────────────┘┘
```

---

## Entities

### 1. users

Represents an authenticated user account. Uses NextAuth.js for authentication with extended profile data.

**Fields**:

| Field                 | Type         | Constraints                | Description                         | Validation                             |
| --------------------- | ------------ | -------------------------- | ----------------------------------- | -------------------------------------- |
| `id`                  | `UUID`       | PK, auto-generated         | Unique identifier                   | -                                      |
| `email`               | `VARCHAR(255)` | UNIQUE, NOT NULL         | User email address                  | Valid email format, unique             |
| `email_verified`      | `TIMESTAMP`  | NULL                       | When email was verified             | -                                      |
| `name`                | `VARCHAR(100)` | NULL                     | User display name                   | Max 100 characters                     |
| `image`               | `VARCHAR(500)` | NULL                     | Profile image URL                   | Valid URL format                       |
| `password_hash`       | `VARCHAR(255)` | NULL                     | Hashed password (for credentials)   | bcrypt hash                            |
| `timezone`            | `VARCHAR(50)` | NOT NULL, default: 'UTC'  | User timezone (IANA format)         | Valid IANA timezone                    |
| `theme`               | `VARCHAR(10)` | default: 'system'         | Theme preference                    | Enum: light, dark, system              |
| `notification_settings` | `JSONB`    | default: '{}'             | Notification preferences            | JSON object                            |
| `created_at`          | `TIMESTAMP`  | NOT NULL, default: now()  | Creation timestamp                  | -                                      |
| `updated_at`          | `TIMESTAMP`  | NOT NULL, default: now()  | Last update timestamp               | -                                      |

**Indexes**:

- `users_email_unique` on `email`
- `users_email_idx` on `email` for login queries

**Validation Rules**:

- Email must be unique across all users
- Timezone must be valid IANA timezone string
- Theme must be one of: "light", "dark", "system" (defaults to "system")

**State Transitions**: None (users are created and updated, not soft-deleted)

---

### 2. accounts (NextAuth.js)

Represents OAuth provider accounts linked to users.

**Fields**:

| Field                 | Type           | Constraints                  | Description              |
| --------------------- | -------------- | ---------------------------- | ------------------------ |
| `id`                  | `UUID`         | PK, auto-generated           | Unique identifier        |
| `user_id`             | `UUID`         | FK → users.id, NOT NULL      | Reference to user        |
| `type`                | `VARCHAR(255)` | NOT NULL                     | Account type             |
| `provider`            | `VARCHAR(255)` | NOT NULL                     | OAuth provider name      |
| `provider_account_id` | `VARCHAR(255)` | NOT NULL                     | Provider's user ID       |
| `refresh_token`       | `TEXT`         | NULL                         | OAuth refresh token      |
| `access_token`        | `TEXT`         | NULL                         | OAuth access token       |
| `expires_at`          | `INTEGER`      | NULL                         | Token expiry timestamp   |
| `token_type`          | `VARCHAR(255)` | NULL                         | Token type               |
| `scope`               | `VARCHAR(255)` | NULL                         | OAuth scopes             |
| `id_token`            | `TEXT`         | NULL                         | OAuth ID token           |
| `session_state`       | `VARCHAR(255)` | NULL                         | Session state            |

**Indexes**:

- `accounts_provider_provider_account_id_unique` on `(provider, provider_account_id)`
- `accounts_user_id_idx` on `user_id`

---

### 3. sessions (NextAuth.js)

Represents active user sessions.

**Fields**:

| Field           | Type           | Constraints             | Description         |
| --------------- | -------------- | ----------------------- | ------------------- |
| `id`            | `UUID`         | PK, auto-generated      | Unique identifier   |
| `session_token` | `VARCHAR(255)` | UNIQUE, NOT NULL        | Session token       |
| `user_id`       | `UUID`         | FK → users.id, NOT NULL | Reference to user   |
| `expires`       | `TIMESTAMP`    | NOT NULL                | Session expiry time |

**Indexes**:

- `sessions_session_token_unique` on `session_token`
- `sessions_user_id_idx` on `user_id`

---

### 4. boards

Represents a habit tracking board/goal.

**Fields**:

| Field              | Type           | Constraints                  | Description                               | Validation                                                                                       |
| ------------------ | -------------- | ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`               | `UUID`         | PK, auto-generated           | Unique identifier                         | -                                                                                                |
| `user_id`          | `UUID`         | FK → users.id, NOT NULL      | Owner of the board                        | Must exist in users                                                                              |
| `name`             | `VARCHAR(50)`  | NOT NULL                     | Board name                                | 1-50 characters, unique per user                                                                 |
| `description`      | `VARCHAR(500)` | NULL                         | Board description                         | Max 500 characters                                                                               |
| `emoji`            | `VARCHAR(10)`  | default: '📊'                | Emoji icon for visual identification      | Single emoji character                                                                           |
| `color`            | `VARCHAR(7)`   | default: '#3B82F6'           | Color theme (hex code)                    | Valid hex color (e.g., "#3B82F6")                                                                |
| `unit_type`        | `VARCHAR(20)`  | NOT NULL                     | Type of tracking unit                     | Enum: boolean, time, distance, volume, mass, calories, money, percentage, custom                 |
| `unit`             | `VARCHAR(20)`  | NULL                         | Display unit label                        | Required if unit_type is "custom"                                                                |
| `target_amount`    | `DECIMAL(10,2)` | NULL                        | Daily target quantity                     | Positive number, only for quantitative units                                                     |
| `current_streak`   | `INTEGER`      | NOT NULL, default: 0         | Current consecutive days streak           | Non-negative integer                                                                             |
| `longest_streak`   | `INTEGER`      | NOT NULL, default: 0         | All-time longest streak record            | Non-negative integer                                                                             |
| `total_check_ins`  | `INTEGER`      | NOT NULL, default: 0         | Total number of check-ins                 | Non-negative integer                                                                             |
| `is_archived`      | `BOOLEAN`      | NOT NULL, default: false     | Whether board is archived                 | -                                                                                                |
| `archived_at`      | `TIMESTAMP`    | NULL                         | When archived                             | Set when is_archived becomes true                                                                |
| `last_check_in_date` | `DATE`       | NULL                         | Date of most recent check-in              | ISO date                                                                                         |
| `created_at`       | `TIMESTAMP`    | NOT NULL, default: now()     | Creation timestamp                        | -                                                                                                |
| `updated_at`       | `TIMESTAMP`    | NOT NULL, default: now()     | Last update timestamp                     | -                                                                                                |

**Indexes**:

- `boards_user_id_idx` on `user_id` for listing user's boards
- `boards_user_id_is_archived_idx` on `(user_id, is_archived)` for filtering active boards
- `boards_user_id_name_unique` on `(user_id, lower(name))` for unique name per user

**Validation Rules**:

- Board name must be unique per user (case-insensitive)
- If unit_type is "custom", `unit` field is required
- target_amount must be positive if provided
- current_streak cannot exceed the number of days since board creation
- longest_streak >= current_streak (always)
- Emoji must be a single Unicode emoji character if provided
- Color must be valid hex format if provided

**State Transitions**:

```
[Active] ──(archive)──> [Archived]
[Archived] ──(restore)──> [Active]
```

---

### 5. check_ins

Represents a single habit completion event. **Multiple check-ins per day are allowed** to support session-based tracking.

**Fields**:

| Field            | Type           | Constraints                  | Description                               | Validation                                               |
| ---------------- | -------------- | ---------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `id`             | `UUID`         | PK, auto-generated           | Unique identifier                         | -                                                        |
| `board_id`       | `UUID`         | FK → boards.id, NOT NULL     | Reference to parent board                 | Must exist in boards                                     |
| `user_id`        | `UUID`         | FK → users.id, NOT NULL      | Reference to user                         | Must match board's user_id                               |
| `date`           | `DATE`         | NOT NULL                     | Check-in date                             | Cannot be future date                                    |
| `timestamp`      | `TIMESTAMP`    | NOT NULL, default: now()     | Exact time of check-in                    | Must be <= current time                                  |
| `amount`         | `DECIMAL(10,2)` | NULL                        | Quantity tracked                          | Positive number, required if board has quantitative unit |
| `note`           | `VARCHAR(500)` | NULL                         | Optional text note                        | Max 500 characters                                       |
| `session_number` | `INTEGER`      | NOT NULL, default: 1         | Session number for this date (1, 2, 3...) | Auto-incremented per day                                 |
| `created_at`     | `TIMESTAMP`    | NOT NULL, default: now()     | Creation timestamp                        | -                                                        |

**Indexes**:

- `check_ins_board_id_idx` on `board_id` for listing board's check-ins
- `check_ins_board_id_date_idx` on `(board_id, date)` for fast date-based queries
- `check_ins_user_id_date_idx` on `(user_id, date)` for cross-board analytics
- `check_ins_board_id_timestamp_idx` on `(board_id, timestamp)` for chronological ordering

**Validation Rules**:

- **Uniqueness**: MULTIPLE check-ins per board per date are ALLOWED
- Date cannot be in the future (based on user's timezone)
- timestamp must be <= current time
- amount must be positive if provided
- user_id must match the board's user_id (security check)
- If board's unit_type is quantitative (not "boolean"), amount is required
- session_number is auto-calculated: max(session_number for date) + 1

**State Transitions**: Check-ins can be created, updated (amount/note), or deleted

---

### 6. insights

Represents auto-generated observations about user behavior patterns.

**Fields**:

| Field            | Type           | Constraints                  | Description                            | Validation                                          |
| ---------------- | -------------- | ---------------------------- | -------------------------------------- | --------------------------------------------------- |
| `id`             | `UUID`         | PK, auto-generated           | Unique identifier                      | -                                                   |
| `user_id`        | `UUID`         | FK → users.id, NOT NULL      | Reference to user                      | Must exist in users                                 |
| `board_id`       | `UUID`         | FK → boards.id, NULL         | Reference to board (if board-specific) | Must exist in boards if provided                    |
| `type`           | `VARCHAR(20)`  | NOT NULL                     | Insight category                       | Enum: pattern, achievement, trend, suggestion       |
| `message`        | `VARCHAR(200)` | NOT NULL                     | Human-readable insight text            | 10-200 characters                                   |
| `date_generated` | `TIMESTAMP`    | NOT NULL, default: now()     | When generated                         | -                                                   |
| `metadata`       | `JSONB`        | NULL                         | Additional data (e.g., stats used)     | JSON object                                         |
| `created_at`     | `TIMESTAMP`    | NOT NULL, default: now()     | Creation timestamp                     | -                                                   |

**Indexes**:

- `insights_user_id_idx` on `user_id` for user's insights
- `insights_board_id_idx` on `board_id` for board-specific insights
- `insights_user_id_date_generated_idx` on `(user_id, date_generated)` for sorting

**Validation Rules**:

- Insights are auto-generated by scheduled job (not user-created)
- Minimum 14 days of check-in data required before generating insights

---

### 7. notifications

Represents scheduled reminder notifications for boards.

**Fields**:

| Field            | Type           | Constraints                  | Description                              | Validation                         |
| ---------------- | -------------- | ---------------------------- | ---------------------------------------- | ---------------------------------- |
| `id`             | `UUID`         | PK, auto-generated           | Unique identifier                        | -                                  |
| `user_id`        | `UUID`         | FK → users.id, NOT NULL      | Reference to user                        | Must exist in users                |
| `board_id`       | `UUID`         | FK → boards.id, NOT NULL, UNIQUE | Reference to board                    | Must exist in boards               |
| `scheduled_time` | `TIME`         | NOT NULL                     | Time of day to send                      | Valid time (e.g., "09:00")         |
| `enabled`        | `BOOLEAN`      | NOT NULL, default: true      | Whether reminder is active               | -                                  |
| `last_sent`      | `TIMESTAMP`    | NULL                         | Last notification sent                   | Auto-updated by scheduler          |
| `timezone`       | `VARCHAR(50)`  | NOT NULL                     | User's timezone for scheduling           | Copied from user.timezone          |
| `created_at`     | `TIMESTAMP`    | NOT NULL, default: now()     | Creation timestamp                       | -                                  |
| `updated_at`     | `TIMESTAMP`    | NOT NULL, default: now()     | Last update timestamp                    | -                                  |

**Indexes**:

- `notifications_user_id_idx` on `user_id` for user's notifications
- `notifications_board_id_unique` on `board_id` (unique constraint)
- `notifications_enabled_scheduled_time_idx` on `(enabled, scheduled_time)` for scheduler queries

**Validation Rules**:

- One notification per board (1:1 relationship)
- scheduled_time must be valid time format
- Notifications only sent if enabled and user hasn't checked in today

---

## Relationships

### User → Boards (1:N)

- One user can own multiple boards
- Cascade delete: When user is deleted, all their boards are deleted
- Query: `SELECT * FROM boards WHERE user_id = $1`

### Board → Check-ins (1:N)

- One board can have multiple check-ins
- Cascade delete: When board is deleted, all its check-ins are deleted
- Multiple check-ins per day allowed
- Query: `SELECT * FROM check_ins WHERE board_id = $1 ORDER BY timestamp DESC`

### User → Insights (1:N)

- One user can have multiple insights
- Insights can be global or board-specific (board_id optional)
- Cascade delete: When user is deleted, their insights are deleted

### User → Notifications (1:N)

- One user can have multiple notifications (one per board)
- Cascade delete: When user is deleted, their notifications are deleted

### Board → Notification (1:1)

- One board can have at most one notification reminder
- Cascade delete: When board is deleted, its notification is deleted

---

## Drizzle Schema Definition

```typescript
// src/lib/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  date,
  time,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// NextAuth.js compatible users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    name: varchar("name", { length: 100 }),
    image: varchar("image", { length: 500 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
    theme: varchar("theme", { length: 10 }).default("system"),
    notificationSettings: jsonb("notification_settings").default({}),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// NextAuth.js accounts table
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    idToken: text("id_token"),
    sessionState: varchar("session_state", { length: 255 }),
  },
  (table) => ({
    providerProviderAccountIdUnique: uniqueIndex(
      "accounts_provider_provider_account_id_unique"
    ).on(table.provider, table.providerAccountId),
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
  })
);

// NextAuth.js sessions table
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

// Habit tracking boards
export const boards = pgTable(
  "boards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(),
    description: varchar("description", { length: 500 }),
    emoji: varchar("emoji", { length: 10 }).default("📊"),
    color: varchar("color", { length: 7 }).default("#3B82F6"),
    unitType: varchar("unit_type", { length: 20 }).notNull(),
    unit: varchar("unit", { length: 20 }),
    targetAmount: decimal("target_amount", { precision: 10, scale: 2 }),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    totalCheckIns: integer("total_check_ins").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { mode: "date" }),
    lastCheckInDate: date("last_check_in_date"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("boards_user_id_idx").on(table.userId),
    userIdIsArchivedIdx: index("boards_user_id_is_archived_idx").on(
      table.userId,
      table.isArchived
    ),
  })
);

// Check-ins (multiple per day supported)
export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boardId: uuid("board_id")
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
    amount: decimal("amount", { precision: 10, scale: 2 }),
    note: varchar("note", { length: 500 }),
    sessionNumber: integer("session_number").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    boardIdIdx: index("check_ins_board_id_idx").on(table.boardId),
    boardIdDateIdx: index("check_ins_board_id_date_idx").on(
      table.boardId,
      table.date
    ),
    userIdDateIdx: index("check_ins_user_id_date_idx").on(
      table.userId,
      table.date
    ),
    boardIdTimestampIdx: index("check_ins_board_id_timestamp_idx").on(
      table.boardId,
      table.timestamp
    ),
  })
);

// Auto-generated insights
export const insights = pgTable(
  "insights",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    boardId: uuid("board_id").references(() => boards.id, {
      onDelete: "cascade",
    }),
    type: varchar("type", { length: 20 }).notNull(),
    message: varchar("message", { length: 200 }).notNull(),
    dateGenerated: timestamp("date_generated", { mode: "date" })
      .notNull()
      .defaultNow(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("insights_user_id_idx").on(table.userId),
    boardIdIdx: index("insights_board_id_idx").on(table.boardId),
    userIdDateGeneratedIdx: index("insights_user_id_date_generated_idx").on(
      table.userId,
      table.dateGenerated
    ),
  })
);

// Scheduled reminders
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    boardId: uuid("board_id")
      .notNull()
      .unique()
      .references(() => boards.id, { onDelete: "cascade" }),
    scheduledTime: time("scheduled_time").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    lastSent: timestamp("last_sent", { mode: "date" }),
    timezone: varchar("timezone", { length: 50 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    enabledScheduledTimeIdx: index("notifications_enabled_scheduled_time_idx").on(
      table.enabled,
      table.scheduledTime
    ),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  boards: many(boards),
  checkIns: many(checkIns),
  insights: many(insights),
  notifications: many(notifications),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  user: one(users, {
    fields: [boards.userId],
    references: [users.id],
  }),
  checkIns: many(checkIns),
  insights: many(insights),
  notification: one(notifications),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  board: one(boards, {
    fields: [checkIns.boardId],
    references: [boards.id],
  }),
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  user: one(users, {
    fields: [insights.userId],
    references: [users.id],
  }),
  board: one(boards, {
    fields: [insights.boardId],
    references: [boards.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  board: one(boards, {
    fields: [notifications.boardId],
    references: [boards.id],
  }),
}));
```

---

## Validation Logic

### Check-in Creation Validation

```typescript
// src/lib/db/validators.ts
import { z } from "zod";

export const createCheckInSchema = z.object({
  boardId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive().optional(),
  note: z.string().max(500).optional(),
});

export async function validateCheckIn(
  db: Database,
  userId: string,
  data: z.infer<typeof createCheckInSchema>
) {
  // 1. Verify board exists and belongs to user
  const board = await db.query.boards.findFirst({
    where: (boards, { eq, and }) =>
      and(eq(boards.id, data.boardId), eq(boards.userId, userId)),
  });

  if (!board) {
    throw new Error("Board not found or unauthorized");
  }

  // 2. Verify date is not in the future
  const today = new Date().toISOString().split("T")[0];
  if (data.date > today) {
    throw new Error("Cannot check in for future dates");
  }

  // 3. Validate amount if required
  if (board.unitType !== "boolean") {
    if (!data.amount || data.amount <= 0) {
      throw new Error("Amount is required for quantitative tracking");
    }
  }

  // 4. Calculate session number
  const existingCheckIns = await db.query.checkIns.findMany({
    where: (checkIns, { eq, and }) =>
      and(eq(checkIns.boardId, data.boardId), eq(checkIns.date, data.date)),
  });

  const sessionNumber = existingCheckIns.length + 1;

  return { ...data, sessionNumber };
}
```

### Streak Calculation Logic

```typescript
// src/lib/streaks.ts

interface CheckIn {
  date: string;
  amount: number | null;
}

export function calculateStreaks(
  checkIns: CheckIn[],
  targetAmount: number | undefined,
  unitType: string
): { current: number; longest: number } {
  if (checkIns.length === 0) return { current: 0, longest: 0 };

  // Group check-ins by date and calculate daily totals
  const dailyTotals = new Map<string, number>();
  for (const checkIn of checkIns) {
    const current = dailyTotals.get(checkIn.date) || 0;
    const amount = checkIn.amount || 1;
    dailyTotals.set(checkIn.date, current + amount);
  }

  // Determine which days "count" for streak
  const validDays = Array.from(dailyTotals.entries())
    .filter(([, total]) => {
      if (unitType === "boolean" || !targetAmount) return true;
      return total >= targetAmount;
    })
    .map(([date]) => date)
    .sort((a, b) => b.localeCompare(a));

  if (validDays.length === 0) return { current: 0, longest: 0 };

  // Calculate current streak
  const today = new Date().toISOString().split("T")[0];
  let currentStreak = 0;
  let checkDate = new Date(today);

  for (const date of validDays) {
    const dateObj = new Date(date);
    const daysDiff = Math.floor(
      (checkDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === currentStreak) {
      currentStreak++;
    } else if (currentStreak === 0 && daysDiff === 1) {
      currentStreak++;
      checkDate = dateObj;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < validDays.length - 1; i++) {
    const current = new Date(validDays[i]);
    const next = new Date(validDays[i + 1]);
    const diff = Math.floor(
      (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}
```

---

## Migration Order

1. `0001_create_users_table.sql`
2. `0002_create_accounts_table.sql`
3. `0003_create_sessions_table.sql`
4. `0004_create_boards_table.sql`
5. `0005_create_check_ins_table.sql`
6. `0006_create_insights_table.sql`
7. `0007_create_notifications_table.sql`

---

## Data Constraints Summary

| Entity        | Unique Constraints              | Required Fields                                              | Cascade Deletes              |
| ------------- | ------------------------------- | ------------------------------------------------------------ | ---------------------------- |
| users         | email                           | id, email, timezone                                          | boards, check_ins, insights, notifications |
| accounts      | (provider, provider_account_id) | id, user_id, type, provider, provider_account_id             | None                         |
| sessions      | session_token                   | id, session_token, user_id, expires                          | None                         |
| boards        | None (unique name per user)     | id, user_id, name, unit_type, current_streak, longest_streak | check_ins, notifications     |
| check_ins     | None (multiple per day)         | id, board_id, user_id, date, timestamp, session_number       | None                         |
| insights      | None                            | id, user_id, type, message, date_generated                   | None                         |
| notifications | board_id                        | id, user_id, board_id, scheduled_time, enabled, timezone     | None                         |

---

## Performance Considerations

1. **Indexes**: All common query patterns have corresponding indexes
2. **Denormalization**: Streak stats cached in boards table to avoid recalculation on reads
3. **Pagination**: Use LIMIT/OFFSET or cursor-based pagination for large check-in lists
4. **Connection Pooling**: Neon provides automatic connection pooling via serverless driver

---

## Neon-Specific Features

### Branching

- **Production branch**: `main` - primary database
- **Development branch**: `dev` - for development and testing
- **Feature branches**: Create per-feature for isolated testing

### Connection Strings

```bash
# Production (pooled)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/checker?sslmode=require"

# Development (pooled)
DATABASE_URL_DEV="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/checker?sslmode=require"
```

---

## Summary

The data model is designed for:

- **Type Safety**: Full TypeScript types via Drizzle ORM
- **Performance**: Strategic indexing and denormalization
- **Data Integrity**: Foreign key constraints and validation rules
- **Scalability**: Neon serverless with automatic scaling
- **Developer Experience**: Branching for safe development

**Status**: Data model updated for Neon PostgreSQL
