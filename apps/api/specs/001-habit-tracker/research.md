# Research Document: Habit Tracking Application

**Feature**: 001-habit-tracker
**Date**: 2025-11-14
**Status**: Complete

## Overview

This document consolidates research findings and technical decisions for the Habit Tracking Application. All technology choices from the Technical Context have been analyzed for suitability, best practices identified, and implementation patterns documented.

---

## 1. Frontend Framework: Next.js 14+ with App Router

### Decision

Use Next.js 14+ with the App Router architecture for the frontend application.

### Rationale

1. **Server Components**: Improved performance through selective client-side hydration
2. **File-based Routing**: Simplified route organization with route groups `(auth)`, `(dashboard)`
3. **Built-in Optimization**: Image optimization, font loading, automatic code splitting
4. **SEO Benefits**: Server-side rendering for landing pages improves discoverability
5. **TypeScript Support**: First-class TypeScript integration out of the box
6. **Ecosystem Maturity**: Large ecosystem, extensive documentation, proven at scale

### Alternatives Considered

- **Vite + React Router**: More lightweight but requires manual setup for SSR, SEO, and optimization. Rejected because Next.js provides these features out of the box, reducing development time.
- **Remix**: Strong alternative with nested routing and data loading patterns, but smaller ecosystem and less established. Next.js chosen for larger community and better Vercel integration.
- **Create React App**: Deprecated and lacks SSR capabilities. Not suitable for modern web apps.

### Best Practices

- Use Server Components by default, Client Components only when needed (interactivity, hooks)
- Leverage `loading.tsx` and `error.tsx` for better UX
- Use route groups to organize related routes without affecting URLs
- Implement streaming with `Suspense` for faster perceived load times
- Use Server Actions for form submissions (secure, no API routes needed)

### Implementation Patterns

```typescript
// app/(dashboard)/page.tsx - Server Component by default
export default async function DashboardPage() {
  // Can fetch data directly - no useEffect needed
  const boards = await getBoards();
  return <BoardsList boards={boards} />;
}

// app/(dashboard)/boards/[id]/page.tsx - Dynamic route
export default async function BoardPage({ params }: { params: { id: string } }) {
  const board = await getBoard(params.id);
  return <BoardDetail board={board} />;
}

// components/check-in-button.tsx - Client Component for interactivity
'use client';
export function CheckInButton({ boardId }: { boardId: string }) {
  const handleCheckIn = async () => { /* ... */ };
  return <Button onClick={handleCheckIn}>Check In</Button>;
}
```

---

## 2. Backend: Convex Serverless Platform

### Decision

Use Convex as the serverless backend platform for database, real-time sync, and API functions.

### Rationale

1. **Real-time Sync**: Built-in reactive subscriptions - critical for multi-device sync requirement
2. **Type Safety**: Automatic TypeScript type generation from schema
3. **Serverless**: No infrastructure management, automatic scaling
4. **Integrated Database**: No separate database setup needed
5. **Optimistic Updates**: Built-in support for optimistic UI updates
6. **Developer Experience**: Hot reload, time-travel debugging, comprehensive dashboard

### Alternatives Considered

- **Firebase**: Similar real-time capabilities but vendor lock-in, less TypeScript-friendly, pricing concerns. Convex chosen for better DX and modern architecture.
- **Supabase**: Excellent PostgreSQL-based alternative with real-time, but requires manual WebSocket setup for same reactivity. More complex for simple use case.
- **Prisma + tRPC + Custom WebSockets**: Full control but significant development overhead to build real-time infrastructure. Convex provides this out of the box.

### Best Practices

- Define schema first in `convex/schema.ts` for type safety
- Use queries for reads, mutations for writes, actions for external calls
- Leverage indexes for performance on filtered queries
- Use `db.query()` pagination for large datasets
- Implement validation in mutations to ensure data integrity
- Use scheduled functions for reminder notifications

### Implementation Patterns

```typescript
// convex/schema.ts - Define database schema
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  boards: defineTable({
    userId: v.string(),
    name: v.string(),
    emoji: v.optional(v.string()),
    color: v.optional(v.string()),
    unitType: v.string(),
    targetAmount: v.optional(v.number()),
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalCheckIns: v.number(),
    isArchived: v.boolean(),
  }).index("by_user", ["userId"]),

  checkIns: defineTable({
    boardId: v.id("boards"),
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    timestamp: v.number(),
    amount: v.optional(v.number()),
    note: v.optional(v.string()),
  }).index("by_board_date", ["boardId", "date"]),
});

// convex/boards.ts - Query example
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db
      .query("boards")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();
  },
});

export const checkIn = mutation({
  args: {
    boardId: v.id("boards"),
    amount: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const date = new Date().toISOString().split("T")[0];

    // Check for existing check-in
    const existing = await ctx.db
      .query("checkIns")
      .withIndex("by_board_date", (q) =>
        q.eq("boardId", args.boardId).eq("date", date),
      )
      .first();

    if (existing) throw new Error("Already checked in today");

    // Create check-in and update board stats
    await ctx.db.insert("checkIns", {
      boardId: args.boardId,
      userId: identity.subject,
      date,
      timestamp: Date.now(),
      amount: args.amount,
      note: args.note,
    });

    // Update streak logic here...
  },
});
```

---

## 3. Authentication: @convex-dev/auth

### Decision

Use @convex-dev/auth (open-source TypeScript authentication framework) instead of Clerk or Auth0.

### Rationale

1. **Full Control**: Complete ownership of user data and authentication flows
2. **No Vendor Lock-in**: Self-hosted, no usage limits or pricing tiers
3. **TypeScript-First**: Built for TypeScript, integrates seamlessly with our stack
4. **Customizable**: Full control over UI, flows, session management
5. **Privacy**: User data stays in our database (Convex)
6. **Cost**: Free, unlimited users

### Alternatives Considered

- **Clerk**: Excellent DX, beautiful UI, but vendor lock-in, costs scale with users, less control. @convex-dev/auth chosen for independence and cost savings.
- **NextAuth.js**: Popular choice but complex configuration, OAuth setup friction. @convex-dev/auth provides simpler API.
- **Auth0**: Enterprise-grade but expensive, overkill for this use case.

### Best Practices

- Store sessions in Convex database for consistency
- Use HTTP-only cookies for session tokens (security)
- Implement rate limiting on auth endpoints (prevent brute force)
- Support OAuth providers (Google, GitHub) alongside email/password
- Validate email format on signup
- Use secure password reset flow with time-limited tokens

### Implementation Patterns

```typescript
// lib/auth.ts - @convex-dev/auth configuration
import { betterAuth } from "@convex-dev/auth";
import { convexAdapter } from "@convex-dev/auth/adapters/convex";

export const auth = betterAuth({
  database: convexAdapter({
    // Convex HTTP URL from environment
    url: process.env.NEXT_PUBLIC_CONVEX_URL!,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});

// app/api/auth/[...all]/route.ts - Auth API route
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler;

// Usage in components
'use client';
import { useSession, signIn, signOut } from "@/lib/auth/client";

export function AuthButton() {
  const session = useSession();

  if (session.data) {
    return <button onClick={() => signOut()}>Sign Out</button>;
  }
  return <button onClick={() => signIn()}>Sign In</button>;
}
```

---

## 4. UI Component Library: shadcn/ui + Tailwind CSS

### Decision

Use shadcn/ui component primitives with Tailwind CSS for styling.

### Rationale

1. **Accessibility**: Built on Radix UI primitives (WCAG 2.1 AA compliant)
2. **Customization**: Components copied into codebase, full control
3. **TypeScript**: Fully typed components
4. **Design System**: Easy to extend with custom design tokens
5. **No Bundle Size Penalty**: Only include components you use
6. **Developer Experience**: Excellent documentation, active community

### Alternatives Considered

- **Material UI**: Heavy bundle size, harder to customize, less modern design aesthetic. shadcn chosen for flexibility and performance.
- **Chakra UI**: Good alternative but runtime CSS-in-JS has performance overhead. Tailwind's compile-time approach is faster.
- **Headless UI**: Great primitives but requires more styling work. shadcn provides pre-styled components on top of headless primitives.

### Best Practices

- Install only needed components to minimize bundle size
- Extend theme in `tailwind.config.ts` for consistent design tokens
- Use CSS variables for theme switching (light/dark mode)
- Leverage Tailwind's responsive utilities for mobile-first design
- Use `cn()` utility for conditional class merging

### Implementation Patterns

```typescript
// components/ui/button.tsx - shadcn Button component (example)
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
}

export function Button({ variant = "default", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-md px-4 py-2 font-medium transition-colors",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
          "bg-destructive text-destructive-foreground": variant === "destructive",
          "border border-input bg-background": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

// Usage
<Button variant="default" onClick={handleClick}>
  Check In
</Button>
```

---

## 5. Heatmap Visualization: @uiw/react-heat-map

### Decision

Use `@uiw/react-heat-map` for GitHub-style calendar heatmap visualization.

### Rationale

1. **Purpose-Built**: Specifically designed for contribution-style heatmaps
2. **Customization**: Supports custom colors, tooltips, cell rendering
3. **Performance**: Efficiently renders 365+ cells
4. **TypeScript Support**: Fully typed
5. **Lightweight**: Small bundle size (~20KB)
6. **Active Maintenance**: Regular updates, responsive maintainer

### Alternatives Considered

- **Custom D3.js Implementation**: Full control but significant development time. Pre-built library provides 90% of needs out of the box.
- **react-calendar-heatmap**: Less actively maintained, fewer customization options.
- **Victory/Recharts**: General charting libraries, overkill for simple heatmap use case.

### Best Practices

- Use memoization to prevent unnecessary re-renders with large datasets
- Implement virtual scrolling for years with many check-ins
- Provide accessible tooltips with keyboard navigation
- Use color scales that work for colorblind users
- Handle leap years correctly (366 days)

### Implementation Patterns

```typescript
// components/analytics/heatmap-calendar.tsx
import HeatMap from '@uiw/react-heat-map';

interface HeatmapCalendarProps {
  checkIns: { date: string; count: number }[];
  year: number;
}

export function HeatmapCalendar({ checkIns, year }: HeatmapCalendarProps) {
  const value = checkIns.map(ci => ({
    date: ci.date,
    count: ci.count,
  }));

  return (
    <HeatMap
      value={value}
      startDate={new Date(`${year}-01-01`)}
      endDate={new Date(`${year}-12-31`)}
      width="100%"
      rectSize={14}
      space={4}
      legendCellSize={12}
      rectProps={{
        rx: 2, // Rounded corners
      }}
      panelColors={{
        0: '#ebedf0',
        1: '#c6e48b',
        4: '#7bc96f',
        8: '#239a3b',
        12: '#196127',
      }}
      rectRender={(props, data) => {
        return (
          <rect
            {...props}
            data-tooltip={`${data.date}: ${data.count || 0} check-ins`}
          />
        );
      }}
    />
  );
}
```

---

## 6. Form Handling: React Hook Form + Zod

### Decision

Use React Hook Form for form state management and Zod for validation schemas.

### Rationale

1. **Performance**: Minimal re-renders, uncontrolled components by default
2. **Type Safety**: Zod schemas provide runtime validation + TypeScript types
3. **Developer Experience**: Simple API, excellent error handling
4. **Bundle Size**: Lightweight compared to Formik
5. **Integration**: Works seamlessly with shadcn/ui form components

### Alternatives Considered

- **Formik**: More popular but heavier bundle, more re-renders. React Hook Form chosen for performance.
- **Custom Validation**: Reinventing the wheel, error-prone. Zod provides battle-tested validation.

### Best Practices

- Define Zod schemas for all forms
- Use `useForm` with `zodResolver` for automatic validation
- Leverage `formState.errors` for error display
- Use controlled components only when necessary (e.g., dependent fields)
- Implement optimistic updates for better UX

### Implementation Patterns

```typescript
// lib/validations/board.ts
import { z } from "zod";

export const boardSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  emoji: z.string().optional(),
  color: z.string().optional(),
  unitType: z.enum(["boolean", "time", "distance", "volume", "mass", "calories", "money", "percentage", "custom"]),
  customUnit: z.string().optional(),
  targetAmount: z.number().positive().optional(),
});

export type BoardFormData = z.infer<typeof boardSchema>;

// components/boards/board-form.tsx
'use client';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { boardSchema, type BoardFormData } from "@/lib/validations/board";

export function BoardForm() {
  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: "",
      unitType: "boolean",
    },
  });

  const onSubmit = async (data: BoardFormData) => {
    // Call Convex mutation
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
      {form.formState.errors.name && <span>{form.formState.errors.name.message}</span>}
      {/* ... */}
    </form>
  );
}
```

---

## 7. Testing Strategy

### Decision

Multi-layer testing approach: Vitest (unit/integration) + Playwright (E2E).

### Rationale

1. **Vitest**: Fast, Jest-compatible API, native ESM support, TypeScript-first
2. **Playwright**: Cross-browser E2E testing, reliable auto-waiting, excellent debugging
3. **Coverage**: Unit tests for logic, integration for workflows, E2E for critical paths
4. **Speed**: Vitest's parallelization speeds up unit test runs

### Alternatives Considered

- **Jest**: Slower than Vitest, requires more configuration for ESM/TypeScript. Vitest chosen for speed and simplicity.
- **Cypress**: Good E2E alternative but Playwright has better TypeScript support and cross-browser coverage.

### Best Practices

- **Unit Tests**: Test pure functions, utility libraries, validation logic
- **Integration Tests**: Test Convex mutations/queries, auth flows
- **E2E Tests**: Test critical user journeys (signup → create board → check in)
- Aim for 80%+ code coverage on business logic
- Use test fixtures for consistent test data
- Mock external services (email, notifications)

### Implementation Patterns

```typescript
// tests/unit/lib/streak-calculator.test.ts
import { describe, it, expect } from "vitest";
import { calculateStreak } from "@/lib/streak-calculator";

describe("calculateStreak", () => {
  it("calculates consecutive days correctly", () => {
    const dates = ["2025-11-14", "2025-11-13", "2025-11-12"];
    expect(calculateStreak(dates)).toBe(3);
  });

  it("resets streak on missing day", () => {
    const dates = ["2025-11-14", "2025-11-12"]; // Missing 11-13
    expect(calculateStreak(dates)).toBe(1);
  });
});

// tests/e2e/check-in-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can create board and check in", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Sign Up");
  // ... signup flow

  await page.click("text=Create Board");
  await page.fill('[name="name"]', "Morning Workout");
  await page.click('button:has-text("Create")');

  await page.click('button:has-text("Check In")');
  await expect(page.locator("text=Check-in successful")).toBeVisible();
});
```

---

## 8. Offline Support & Real-time Sync

### Decision

Implement offline-first architecture with Convex's built-in optimistic updates and local queuing.

### Rationale

1. **User Experience**: Allow check-ins even without internet connection
2. **Mobile Use Case**: Users may be in areas with poor connectivity
3. **Convex Support**: Built-in optimistic mutations simplify implementation
4. **Reliability**: Queue ensures no data loss

### Best Practices

- Use Convex's optimistic mutations for instant UI feedback
- Queue failed mutations in IndexedDB for retry
- Display sync status indicator to user
- Handle conflicts (e.g., duplicate check-ins from multiple devices)
- Implement exponential backoff for retry logic

### Implementation Patterns

```typescript
// lib/hooks/use-offline-sync.ts
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingMutations, setPendingMutations] = useState<any[]>([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Retry pending mutations
      pendingMutations.forEach((mutation) => {
        // Execute queued mutations
      });
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pendingMutations]);

  return { isOnline, pendingMutations };
}

// Usage in check-in button
const checkIn = useMutation(api.checkIns.create);

const handleCheckIn = async () => {
  try {
    await checkIn({ boardId, amount });
  } catch (error) {
    if (!navigator.onLine) {
      // Queue for later
      queueMutation({ boardId, amount });
    }
  }
};
```

---

## 9. Streak Calculation Algorithm

### Decision

Calculate streaks server-side in Convex mutations to ensure consistency across devices.

### Rationale

1. **Single Source of Truth**: Server calculates, clients display
2. **Consistency**: No divergence between devices
3. **Performance**: Pre-calculated streaks, no client-side computation on render
4. **Accuracy**: Critical business logic should not be client-side

### Best Practices

- Recalculate streak on every check-in addition/deletion
- Use timezone-aware date comparisons
- Handle edge cases (leap years, timezone changes, historical edits)
- Cache streak calculations in board record for fast reads

### Implementation Patterns

```typescript
// convex/lib/streak-calculator.ts
export function calculateCurrentStreak(checkIns: { date: string }[]): number {
  if (checkIns.length === 0) return 0;

  // Sort by date descending
  const sorted = checkIns.sort((a, b) => b.date.localeCompare(a.date));

  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  let currentDate = new Date(today);

  for (const checkIn of sorted) {
    const checkInDate = new Date(checkIn.date);
    const daysDiff = Math.floor(
      (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Usage in check-in mutation
export const checkIn = mutation({
  // ... args
  handler: async (ctx, args) => {
    // Create check-in
    await ctx.db.insert("checkIns", {
      /* ... */
    });

    // Recalculate streak
    const allCheckIns = await ctx.db
      .query("checkIns")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();

    const currentStreak = calculateCurrentStreak(allCheckIns);
    const board = await ctx.db.get(args.boardId);

    // Update board stats
    await ctx.db.patch(args.boardId, {
      currentStreak,
      longestStreak: Math.max(currentStreak, board!.longestStreak),
      totalCheckIns: board!.totalCheckIns + 1,
    });
  },
});
```

---

## 10. Deployment Strategy

### Decision

Deploy frontend to Vercel, backend to Convex Cloud.

### Rationale

1. **Vercel**: Optimized for Next.js (built by same company), edge network, automatic previews
2. **Convex Cloud**: Purpose-built for Convex backend, automatic scaling, monitoring
3. **Simplicity**: No infrastructure management, focus on features
4. **Cost**: Generous free tiers for both platforms

### Best Practices

- Use environment variables for configuration
- Set up preview deployments for PRs (automatic with Vercel)
- Monitor performance with Vercel Analytics and Convex Dashboard
- Implement error tracking (e.g., Sentry)
- Use Vercel's ISR (Incremental Static Regeneration) for public pages

### Implementation Patterns

```typescript
// vercel.json - Vercel configuration
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_CONVEX_URL": "@convex-url",
    "BETTER_AUTH_SECRET": "@auth-secret"
  }
}

// convex.json - Convex configuration
{
  "functions": "convex/",
  "node": {
    "version": "18"
  }
}
```

---

## 11. Next.js 16 (Latest Version)

### Decision

Use Next.js 16 (latest) instead of Next.js 14+ for cutting-edge features and performance.

### Rationale

1. **Turbopack Stable**: Faster builds and Hot Module Replacement (HMR)
2. **Enhanced Caching**: New `use cache` directive for granular control
3. **React 19 Support**: Latest React features (Server Actions, useTransition improvements)
4. **Improved Performance**: Better App Router performance and streaming
5. **Partial Prerendering**: Static shell + dynamic content for best of both worlds

### Alternatives Considered

- **Next.js 14**: Stable but missing latest optimizations. Next.js 16 is production-ready.
- **Next.js 15**: Already superseded by version 16.

### Best Practices

- Use `next.config.ts` (TypeScript config) instead of `next.config.js`
- Leverage `use cache` for expensive computations
- Use Turbopack for faster dev builds: `next dev --turbo`
- Optimize with Partial Prerendering for marketing pages

### Implementation Patterns

```typescript
// next.config.ts - TypeScript configuration
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      // Turbopack configuration
    },
    ppr: "incremental", // Partial Prerendering
  },
};

export default config;

// Using 'use cache' directive (Next 16 feature)
("use cache");
export async function getExpensiveData() {
  // This function's result will be cached
  const data = await fetch("...");
  return data;
}

// React 19 Server Actions
("use server");
export async function createBoard(formData: FormData) {
  // Server-side form handling without API routes
}
```

**Migration Notes from Next 14**:

- React 18 → React 19 (automatic with Next 16)
- `next/image` has new optimizations
- Font optimization improved
- Middleware runs faster

---

## 12. API Testing & Documentation: Bruno + Swagger

### Decision

Use **Bruno** for API testing and **Swagger/OpenAPI** for auto-generated documentation.

### Bruno (Postman/Insomnia Alternative)

**Rationale**:

1. **Open-source & Privacy**: No account required, fully offline
2. **Git-Friendly**: Collections stored as plain text files (can be version controlled)
3. **Lightweight**: No bloated desktop app, no cloud sync
4. **Team Collaboration**: Share collections via git, not cloud accounts
5. **Free Forever**: No usage limits or pricing tiers

**Alternatives Considered**:

- **Postman**: Requires account, cloud-based, privacy concerns, expensive for teams. Rejected for vendor lock-in.
- **Insomnia**: Recently acquired by Kong, uncertain future, features being paywalled. Rejected for instability.
- **Thunder Client**: VS Code only, limited features. Bruno has standalone app.
- **HTTPie**: CLI only, no GUI. Bruno provides both.

**Best Practices**:

- Store collections in `bruno/` folder at project root
- Use environment variables for local/staging/prod
- Write JavaScript pre-request scripts for dynamic data
- Use tests to validate responses
- Commit collections to git for team sharing

### Swagger/OpenAPI Integration

**Rationale**:

1. **Auto-Documentation**: Generate docs from code (Convex schema)
2. **Interactive Explorer**: Test API directly from browser
3. **Type Safety**: Validate requests/responses against schema
4. **Client Generation**: Auto-generate TypeScript types
5. **Standard Format**: OpenAPI is industry standard

**Implementation Strategy**:

- Create OpenAPI 3.0 schema from Convex functions
- Serve Swagger UI at `/api/docs` route
- Auto-sync Bruno collections from OpenAPI spec

**Best Practices**:

- Keep `openapi.yaml` in `specs/###-feature/contracts/`
- Use tags to organize endpoints (Auth, Boards, Check-ins, etc.)
- Document error responses with examples
- Include authentication requirements (@convex-dev/auth cookies)

### Implementation Patterns

**Bruno Collection Structure**:

```
bruno/
├── collection.bru              # Collection metadata
├── environments/
│   ├── local.bru               # localhost:3000
│   ├── staging.bru             # staging URL
│   └── production.bru          # production URL
├── boards/
│   ├── create-board.bru        # POST boards.create
│   ├── list-boards.bru         # POST boards.list
│   ├── delete-board.bru        # POST boards.delete
│   └── update-board.bru        # POST boards.update
├── check-ins/
│   ├── create-checkin.bru
│   ├── list-for-date.bru
│   └── count-today.bru
└── analytics/
    ├── board-stats.bru
    └── daily-aggregates.bru
```

**Example Bruno Request** (`bruno/boards/create-board.bru`):

```bru
meta {
  name: Create Board
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/api/mutation/boards.create
  body: json
  auth: none
}

body:json {
  {
    "name": "Morning Workout",
    "emoji": "💪",
    "unitType": "boolean"
  }
}

vars:pre-request {
  baseUrl: {{process.env.CONVEX_URL}}
}

tests {
  test("Board created", function() {
    expect(res.status).to.equal(200);
    expect(res.body.boardId).to.be.a('string');
  });
}
```

**Swagger UI Setup**:

```typescript
// app/api/docs/route.ts
import { generateHTML } from "swagger-ui-express";
import openapiSpec from "@/specs/001-habit-tracker/contracts/openapi.yaml";

export async function GET() {
  const html = generateHTML(openapiSpec);
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
```

**Benefits for Team**:

- **Developers**: Bruno for manual testing during development
- **QA**: Swagger UI for exploratory testing
- **Documentation**: OpenAPI as single source of truth
- **CI/CD**: Bruno CLI for automated API tests

---

## 13. Runtime & Package Manager: Bun

### Decision

Use **Bun** as the JavaScript runtime, package manager, build tool, and test runner.

### Rationale

1. **Performance**: 10-100x faster than npm/pnpm for package installation
2. **All-in-One**: Single tool for package management, running scripts, testing, and bundling
3. **Native TypeScript**: Built-in TypeScript support without transpilation step
4. **Drop-in Replacement**: Compatible with npm packages and package.json
5. **Fast Test Runner**: Native test runner compatible with Jest API (faster than Vitest)
6. **Modern**: Built from scratch with modern web standards

### Alternatives Considered

- **npm**: Slower, basic features. Bun chosen for speed and developer experience.
- **pnpm**: Fast and disk-efficient, but Bun is faster and includes test runner.
- **Yarn**: Popular but slower than Bun, no built-in test runner.

### Best Practices

- Use `bun install` for dependency installation (respects package-lock.json)
- Use `bun run` for scripts (faster than npm run)
- Use `bun test` for running Vitest tests (native Bun test runner)
- Use `bunx` instead of `npx` for running packages without installation
- Lock versions with `bun.lockb` (binary lockfile, faster than JSON)

### Implementation Patterns

```bash
# Package management
bun install              # Install dependencies
bun add react           # Add dependency
bun add -d typescript   # Add dev dependency
bun remove lodash       # Remove dependency

# Running scripts
bun dev                 # Start dev server
bun build              # Build for production
bun test               # Run tests

# Running packages
bunx convex dev        # Run Convex CLI
bunx create-next-app   # Create Next.js project

# Testing with Bun (if using Bun test runner)
bun test               # Run all tests
bun test --watch       # Watch mode
```

**Performance Benefits**:

- Package installation: ~3-5x faster than pnpm, ~10x faster than npm
- Script execution: ~2-3x faster startup time
- Test running: ~2-4x faster than Vitest with Node

**Compatibility**:

- Works with existing `package.json` and `package-lock.json`
- Compatible with all npm packages
- Can be used alongside npm/pnpm if needed

---

## 14. Code Quality: Biome (Linter + Formatter)

### Decision

Use **Biome** as the primary linting and formatting tool (replaces ESLint + Prettier).

### Rationale

1. **Performance**: 10-100x faster than ESLint + Prettier (written in Rust)
2. **All-in-One**: Combines linting, formatting, and import organization in a single tool
3. **Zero Config**: Works out of the box with sensible defaults
4. **Consistent**: Same tool for all TypeScript/JavaScript files
5. **Editor Integration**: First-class VS Code extension
6. **Compatible**: Supports same rules as ESLint/Prettier

### Alternatives Considered

- **ESLint + Prettier**: Industry standard but slow, requires two separate tools. Biome chosen for speed and simplicity.
- **ESLint alone**: Missing formatting capabilities.
- **Prettier alone**: Missing linting capabilities.
- **dprint**: Fast but less mature ecosystem than Biome.

### Best Practices

- Configure `biome.json` at project root
- Use recommended rules as baseline
- Enable auto-fix on save in VS Code
- Run Biome in pre-commit hooks
- Use tabs for indentation (consistency with global CLAUDE.md standards)
- Use double quotes for strings (consistency with global CLAUDE.md standards)

### Implementation Patterns

**biome.json Configuration**:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error",
        "noVar": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "asNeeded"
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

**package.json Scripts**:

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

**VS Code Integration** (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

**Command Line Usage**:

```bash
# Check code (linting + formatting)
bun run lint

# Auto-fix all issues
bun run lint:fix

# Format only (no linting)
bun run format

# Check specific files
biome check src/components/**/*.tsx

# CI mode (exit with error if issues found)
biome ci .
```

**Biome vs ESLint + Prettier**:

- **Speed**: Biome checks 100k+ lines in <1 second vs 10-30 seconds for ESLint+Prettier
- **Configuration**: Single `biome.json` vs multiple config files
- **Memory**: Lower memory usage (Rust vs Node.js)
- **Features**: Same linting + formatting capabilities

**Migration from ESLint + Prettier**:

- Remove `.eslintrc.*`, `.prettierrc.*`, `.eslintignore`, `.prettierignore`
- Uninstall `eslint`, `prettier`, and all plugins
- Install Biome: `bun add -d @biomejs/biome`
- Create `biome.json` with similar rules
- Update scripts in `package.json`

---

## Summary

All technical decisions have been researched and documented. No NEEDS CLARIFICATION items remain. The technology stack is:

- **Frontend**: Next.js 16 (latest) with App Router, React 19, TypeScript 5.x
- **UI**: shadcn/ui, Tailwind CSS, @uiw/react-heat-map, Lucide Icons
- **Backend**: Convex serverless platform
- **Auth**: @convex-dev/auth
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest (run with Bun) + Playwright
- **API Testing**: Bruno (Postman alternative)
- **API Docs**: Swagger/OpenAPI 3.0
- **Runtime**: Bun (package manager, build tool, test runner)
- **Code Quality**: Biome (linter + formatter, replaces ESLint + Prettier)
- **Deployment**: Vercel + Convex Cloud

Each choice is justified by functional requirements, best practices identified, and implementation patterns documented for consistent development.

**Status**: ✅ Ready to proceed to Phase 1 (Design & Contracts)
