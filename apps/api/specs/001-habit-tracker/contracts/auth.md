# Authentication Contracts

This file defines NextAuth.js integration and user management operations.

## Architecture Overview

**Authentication Stack**:

- **NextAuth.js v5** (Auth.js): Modern authentication for Next.js with App Router support
- **Drizzle Adapter**: Type-safe database adapter for NextAuth.js
- **Neon PostgreSQL**: Serverless database for session and user storage
- **Integration Pattern**: NextAuth.js -> Drizzle ORM -> Neon PostgreSQL

### NextAuth.js Configuration

NextAuth.js is configured with credentials (email/password) and OAuth providers:

```typescript
// src/lib/auth.ts
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

### API Route Handler

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### Session Flow

1. **User signs in** via NextAuth.js (email/password or OAuth)
2. **JWT token created** with user ID and session data
3. **Session validated** on each request via middleware
4. **Server actions** access session via `auth()` function
5. **Client components** access session via `useSession()` hook

### Database Schema (Drizzle)

```typescript
// src/lib/db/schema.ts
import { pgTable, uuid, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";

// Users table (NextAuth.js compatible with extensions)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  name: varchar("name", { length: 100 }),
  image: varchar("image", { length: 500 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  timezone: varchar("timezone", { length: 50 }).notNull().default("UTC"),
  theme: varchar("theme", { length: 10 }).default("system"),
  notificationSettings: jsonb("notification_settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Accounts table (for OAuth providers)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
});

// Sessions table (for database sessions - optional with JWT)
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});
```

### Middleware Protection

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/sign-in") ||
                     req.nextUrl.pathname.startsWith("/sign-up");
  const isProtectedPage = req.nextUrl.pathname.startsWith("/dashboard") ||
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

## Server Actions

### registerUser

**Type**: Server Action
**Auth Required**: No

#### Arguments

| Parameter  | Type     | Required | Description    | Validation              |
| ---------- | -------- | -------- | -------------- | ----------------------- |
| `email`    | `string` | Yes      | User email     | Valid email format      |
| `password` | `string` | Yes      | User password  | Min 8 characters        |
| `name`     | `string` | No       | Display name   | Max 100 characters      |

#### Returns

| Field   | Type     | Description     |
| ------- | -------- | --------------- |
| `success` | `boolean` | Registration result |
| `userId` | `string` | Created user ID |

#### Errors

- Email already exists: `"Email already registered"`
- Invalid email format: `"Invalid email address"`
- Password too short: `"Password must be at least 8 characters"`

#### Example

```typescript
// src/app/actions/auth.ts
"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  // Check if email exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 12);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      name: data.name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
    .returning();

  return { success: true, userId: user.id };
}
```

---

### getCurrentUser

**Type**: Server Action / Query
**Auth Required**: Yes

#### Arguments

None

#### Returns

| Field      | Type                  | Description       |
| ---------- | --------------------- | ----------------- |
| `id`       | `string`              | User ID           |
| `email`    | `string`              | User email        |
| `name`     | `string | null`       | Display name      |
| `image`    | `string | null`       | Profile image URL |
| `timezone` | `string`              | User timezone     |
| `theme`    | `string`              | Theme preference  |

#### Errors

- Not authenticated: `"Unauthenticated"`
- User not found: `"User not found"`

#### Example

```typescript
// src/app/actions/users.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    timezone: user.timezone,
    theme: user.theme,
  };
}
```

---

### updateProfile

**Type**: Server Action
**Auth Required**: Yes

#### Arguments

| Parameter              | Type     | Required | Description            | Validation                      |
| ---------------------- | -------- | -------- | ---------------------- | ------------------------------- |
| `name`                 | `string` | No       | New display name       | Max 100 characters              |
| `timezone`             | `string` | No       | New timezone           | Valid IANA timezone             |
| `theme`                | `string` | No       | New theme              | `"light" | "dark" | "system"`   |
| `notificationSettings` | `object` | No       | Notification prefs     | JSON object                     |

#### Returns

| Field     | Type      | Description     |
| --------- | --------- | --------------- |
| `success` | `boolean` | Always `true`   |
| `user`    | `object`  | Updated user    |

#### Errors

- Not authenticated: `"Unauthenticated"`
- Invalid timezone: `"Invalid timezone format"`

#### Example

```typescript
// src/app/actions/users.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  name?: string;
  timezone?: string;
  theme?: string;
  notificationSettings?: object;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  const [updated] = await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning();

  revalidatePath("/settings");

  return { success: true, user: updated };
}
```

---

### deleteAccount

**Type**: Server Action
**Auth Required**: Yes

#### Arguments

None

#### Returns

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `success` | `boolean` | Always `true` |

#### Errors

- Not authenticated: `"Unauthenticated"`

#### Example

```typescript
// src/app/actions/users.ts
"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function deleteAccount() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  // Delete user (cascades to all related data)
  await db.delete(users).where(eq(users.id, session.user.id));

  // Sign out
  await signOut();

  return { success: true };
}
```

#### Implementation Notes

- Cascade deletes all user data:
  - User profile
  - All boards
  - All check-ins
  - All insights
  - All notifications
  - OAuth accounts and sessions
- Irreversible operation - shows confirmation dialog in UI

---

### getUserStats

**Type**: Server Action
**Auth Required**: Yes

#### Arguments

None

#### Returns

| Field           | Type     | Description                       |
| --------------- | -------- | --------------------------------- |
| `totalBoards`   | `number` | Total boards (active + archived)  |
| `activeBoards`  | `number` | Active boards count               |
| `totalCheckIns` | `number` | Total check-ins across all boards |
| `longestStreak` | `number` | Best streak across all boards     |
| `accountAge`    | `number` | Days since account creation       |

#### Errors

- Not authenticated: `"Unauthenticated"`

#### Example

```typescript
// src/app/actions/users.ts
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, boards, checkIns } from "@/lib/db/schema";
import { eq, and, count, max, sql } from "drizzle-orm";

export async function getUserStats() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthenticated");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get board counts
  const boardStats = await db
    .select({
      total: count(),
      active: sql<number>`sum(case when ${boards.isArchived} = false then 1 else 0 end)`,
      longestStreak: max(boards.longestStreak),
    })
    .from(boards)
    .where(eq(boards.userId, session.user.id));

  // Get total check-ins
  const checkInStats = await db
    .select({ total: count() })
    .from(checkIns)
    .where(eq(checkIns.userId, session.user.id));

  // Calculate account age
  const accountAge = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    totalBoards: boardStats[0]?.total || 0,
    activeBoards: boardStats[0]?.active || 0,
    totalCheckIns: checkInStats[0]?.total || 0,
    longestStreak: boardStats[0]?.longestStreak || 0,
    accountAge,
  };
}
```

---

## Client-Side Authentication

### Sign In (Client Component)

```typescript
"use client";

import { signIn } from "next-auth/react";

// Email/password sign-in
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  redirectTo: "/dashboard",
});

// OAuth sign-in
await signIn("google", { redirectTo: "/dashboard" });
await signIn("github", { redirectTo: "/dashboard" });
```

### Sign Out (Client Component)

```typescript
"use client";

import { signOut } from "next-auth/react";

await signOut({ redirectTo: "/" });
```

### Session Hook

```typescript
"use client";

import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <LoginButton />;
  }

  return (
    <div>
      <span>{session.user.name}</span>
      <SignOutButton />
    </div>
  );
}
```

### Session Provider

```typescript
// src/app/layout.tsx
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```
