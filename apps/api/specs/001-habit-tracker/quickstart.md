# Quick Start Guide - Habit Tracking Application

**Feature**: 001-habit-tracker
**Date**: 2025-11-28

This guide walks through setting up the development environment and implementing the first functional feature.

---

## Prerequisites

- **Node.js**: 18.x or higher
- **Bun**: Latest version (package manager and runtime)
- **Git**: For version control
- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Code Editor**: VS Code recommended (with TypeScript extensions)
- **Neon Account**: Free tier at https://neon.tech

---

## 1. Project Setup

### Initialize Next.js Project

```bash
# Create Next.js 15 project with TypeScript
bunx create-next-app@latest checker \
  --typescript \
  --tailwind \
  --app \
  --turbo \
  --src-dir \
  --import-alias="@/*"

cd checker
```

### Install Dependencies

```bash
# Core dependencies
bun add \
  next@15 \
  react@19 \
  react-dom@19 \
  @neondatabase/serverless \
  drizzle-orm \
  next-auth@beta \
  @auth/drizzle-adapter \
  @uiw/react-heat-map \
  @tanstack/react-form \
  @tanstack/zod-form-adapter \
  zod \
  lucide-react \
  date-fns \
  bcryptjs \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-select \
  class-variance-authority \
  clsx \
  tailwind-merge

# Dev dependencies
bun add -D \
  drizzle-kit \
  @types/bcryptjs \
  vitest \
  @vitejs/plugin-react \
  @playwright/test \
  @types/node \
  @biomejs/biome
```

### Initialize shadcn/ui

```bash
bunx shadcn@latest init

# Install initial components
bunx shadcn@latest add button
bunx shadcn@latest add dialog
bunx shadcn@latest add input
bunx shadcn@latest add label
bunx shadcn@latest add form
bunx shadcn@latest add card
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add select
bunx shadcn@latest add toast
```

---

## 2. Setup Neon Database

### Create Neon Project via CLI

```bash
# Install Neon CLI globally
bun add -g neonctl

# Authenticate with Neon
neonctl auth

# Create new project
neonctl projects create --name checker

# Note the project ID from output
# Example: project_id: ep-cool-darkness-123456
```

### Create Database Branches

```bash
# Get your project ID
neonctl projects list

# Create development branch from main
neonctl branches create \
  --project-id <your-project-id> \
  --name dev \
  --parent main

# Get connection strings for both branches
neonctl connection-string --project-id <your-project-id> --branch main --pooled
neonctl connection-string --project-id <your-project-id> --branch dev --pooled
```

### Configure Environment Variables

Create `.env.local`:

```bash
# Database (Neon - Development)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/checker?sslmode=require"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# OAuth Providers (optional for now)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

Create `.env.example` for the repository:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/checker?sslmode=require"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

---

## 3. Setup Drizzle ORM

### Create Database Schema

Create `src/lib/db/schema.ts`:

```typescript
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

// Users table (NextAuth.js compatible)
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

// Accounts table (NextAuth.js)
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

// Sessions table (NextAuth.js)
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

// Boards table
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

// Check-ins table
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
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  boards: many(boards),
  checkIns: many(checkIns),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  user: one(users, {
    fields: [boards.userId],
    references: [users.id],
  }),
  checkIns: many(checkIns),
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
```

### Create Database Client

Create `src/lib/db/index.ts`:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
```

### Configure Drizzle Kit

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Generate and Run Migrations

```bash
# Generate migrations from schema
bunx drizzle-kit generate

# Push schema to database (development)
bunx drizzle-kit push

# Or run migrations (production)
bunx drizzle-kit migrate
```

---

## 4. Setup NextAuth.js

### Create Auth Configuration

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
});
```

### Create Auth API Route

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Create Auth Middleware

Create `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/sign-in") ||
    req.nextUrl.pathname.startsWith("/sign-up");
  const isProtectedPage =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/boards");

  if (isProtectedPage && !isLoggedIn) {
    return Response.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 5. Create App Structure

### Create Root Layout

Update `src/app/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Checker - Habit Tracker",
  description: "Visual habit tracking with heatmap calendars",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## 6. Implement First Feature: Create Board

### Create Board Form Component

Create `src/components/boards/board-form.tsx`:

```typescript
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBoard } from "@/app/actions/boards";

const boardSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  emoji: z.string().optional(),
  unitType: z.enum([
    "boolean",
    "time",
    "distance",
    "volume",
    "mass",
    "calories",
    "money",
    "percentage",
    "custom",
  ]),
  targetAmount: z.number().positive().optional(),
});

export function BoardForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm({
    defaultValues: {
      name: "",
      emoji: "📊",
      unitType: "boolean" as const,
      targetAmount: undefined as number | undefined,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: boardSchema,
    },
    onSubmit: async ({ value }) => {
      await createBoard(value);
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="name">
        {(field) => (
          <div>
            <Label htmlFor="name">Board Name</Label>
            <Input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Morning Workout"
            />
            {field.state.meta.errors && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="unitType">
        {(field) => (
          <div>
            <Label htmlFor="unitType">Tracking Type</Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boolean">Yes/No</SelectItem>
                <SelectItem value="time">Time (minutes)</SelectItem>
                <SelectItem value="distance">Distance (km)</SelectItem>
                <SelectItem value="volume">Volume (liters)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      <Button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? "Creating..." : "Create Board"}
      </Button>
    </form>
  );
}
```

### Create Server Action for Boards

Create `src/app/actions/boards.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { boards } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createBoard(data: {
  name: string;
  emoji?: string;
  unitType: string;
  targetAmount?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  // Check for duplicate name
  const existing = await db.query.boards.findFirst({
    where: and(
      eq(boards.userId, session.user.id),
      eq(boards.name, data.name)
    ),
  });

  if (existing) {
    throw new Error("A board with this name already exists");
  }

  // Create board
  const [board] = await db
    .insert(boards)
    .values({
      userId: session.user.id,
      name: data.name,
      emoji: data.emoji || "📊",
      color: "#3B82F6",
      unitType: data.unitType,
      targetAmount: data.targetAmount?.toString(),
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      isArchived: false,
    })
    .returning();

  revalidatePath("/dashboard");

  return { boardId: board.id, board };
}

export async function getBoards(includeArchived = false) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  const userBoards = await db.query.boards.findMany({
    where: includeArchived
      ? eq(boards.userId, session.user.id)
      : and(eq(boards.userId, session.user.id), eq(boards.isArchived, false)),
    orderBy: (boards, { desc }) => [desc(boards.lastCheckInDate)],
  });

  return userBoards;
}
```

### Create Dashboard Page

Create `src/app/(dashboard)/page.tsx`:

```typescript
import { getBoards } from "@/app/actions/boards";
import { BoardForm } from "@/components/boards/board-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default async function DashboardPage() {
  const boards = await getBoards();

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Boards</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Board</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <BoardForm />
          </DialogContent>
        </Dialog>
      </div>

      {boards.length === 0 ? (
        <p className="text-muted-foreground">
          No boards yet. Create your first one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{board.emoji}</span>
                <h3 className="font-semibold">{board.name}</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Current Streak: {board.currentStreak} days</p>
                <p>Total Check-ins: {board.totalCheckIns}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 7. Run Development Server

```bash
# Run Next.js dev server with Turbopack
bun dev --turbo
```

Open browser to:

- **App**: `http://localhost:3000`
- **Neon Console**: `https://console.neon.tech`

---

## 8. Test First Feature

1. **Create a board**: Click "Create Board", fill in name, select tracking type
2. **Verify database**: Check Neon console to see board record created
3. **Test persistence**: Refresh page to verify data persists

---

## Next Steps

### Phase 1 (P1): Core MVP

- [ ] Implement check-in functionality
- [ ] Add heatmap calendar visualization
- [ ] Implement streak calculation
- [ ] Complete authentication (signup/login pages)
- [ ] Create board detail page

### Phase 2 (P2): Enhanced Features

- [ ] Add quantitative tracking support
- [ ] Implement dashboard analytics
- [ ] Add board archiving
- [ ] Create completion rate calculations

### Phase 3 (P3): Advanced Features

- [ ] Historical check-in editing
- [ ] Browser notifications
- [ ] Personalized insights
- [ ] Offline support with optimistic updates

---

## Neon CLI Quick Reference

```bash
# Authentication
neonctl auth                    # Login to Neon

# Projects
neonctl projects list           # List all projects
neonctl projects create         # Create new project
neonctl projects delete <id>    # Delete project

# Branches
neonctl branches list           # List branches
neonctl branches create         # Create branch
neonctl branches delete <name>  # Delete branch
neonctl branches reset <name>   # Reset branch to parent

# Connection strings
neonctl connection-string       # Get connection string
neonctl connection-string --pooled  # Get pooled connection

# Database operations
neonctl databases list          # List databases
neonctl roles list              # List roles
```

---

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in `.env.local`
- Check Neon console for branch status
- Ensure SSL mode is set: `?sslmode=require`

### Authentication Errors

- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your development URL
- Clear browser cookies and retry

### Type Errors

- Run `bunx drizzle-kit generate` to regenerate types
- Restart TypeScript server in VS Code

---

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [NextAuth.js Documentation](https://authjs.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Project Specification](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/)

---

**Status**: Quick start guide updated for Neon PostgreSQL
