# Implementation Plan: Habit Tracking Application

**Branch**: `001-habit-tracker` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-habit-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

A modern habit tracking web application inspired by Checker (getchecker.app) featuring visual grid-based progress tracking through interactive heatmap calendars, comprehensive streak analytics, and multi-unit support. Users can create unlimited habit boards, perform daily check-ins with optional quantities, and visualize their progress through year-long heatmap calendars similar to GitHub contribution graphs. The app transforms habit data into meaningful metrics (streaks, completion rates, personalized insights) to drive motivation and consistency.

**Technical Approach**: Built with Next.js 16 App Router, React 19, TypeScript, and shadcn/ui on the frontend, powered by Convex serverless backend for real-time sync and type-safe queries. Authentication via @convex-dev/auth (open-source alternative to Clerk), API testing with Bruno, documentation with Swagger/OpenAPI, deployment on Vercel with Convex Cloud backend.

## Technical Context

**Language/Version**: TypeScript 5.x, Next.js 16 (October 2025 release) with App Router and React 19.2
**Primary Dependencies**:

- Frontend: React 19.2, shadcn/ui, Tailwind CSS, TanStack Form + Zod, @uiw/react-heat-map, Lucide Icons
- Backend: Convex (serverless backend with real-time sync)
- Auth: @convex-dev/auth (open-source TypeScript auth framework)
- Testing: Vitest (unit/integration), Playwright (E2E)
- API Testing: Bruno (Postman alternative, git-friendly)
- API Docs: Swagger/OpenAPI 3.0
- Dev Tools: Bun (runtime, package manager, build tool, test runner), Biome (linter + formatter)

**Storage**: Convex Database (integrated serverless database with real-time capabilities, automatic indexing)
**Testing**: Vitest (run with Bun) for unit/integration tests, Playwright for E2E tests
**Runtime**: Bun v1.x (replaces Node.js) - used for ALL operations:

- Package management (`bun install`, `bun add`, `bun remove`)
- Development server (`bun dev --turbo` with Next.js 16 Turbopack)
- Build process (`bun run build`)
- Test runner (`bun test` with Vitest)
- Script execution (all npm scripts run via `bun run`)
  **Code Quality**: Biome v2.x for fast linting and formatting (replaces ESLint + Prettier)
  **Target Platform**: Web application (desktop + mobile browsers), deployed on Vercel + Convex Cloud
  **Project Type**: Web application (frontend + serverless backend)
  **Performance Goals**:
- Heatmap load time: < 2 seconds (365 days of data)
- Check-in response time: < 1 second
- Offline sync time: < 5 seconds
- Real-time sync latency: < 500ms
- Support 1000+ concurrent users

**Constraints**:

- WCAG 2.1 AA accessibility compliance
- Offline-capable (queue check-ins, sync when online)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile-first responsive design
- Real-time multi-device sync
- Data accuracy: 99.9% (no lost check-ins, correct streak calculations)

**Scale/Scope**:

- Target: 10k+ active users
- Expected load: 100k+ check-ins per day
- Data retention: unlimited historical data
- 15+ core screens (landing, auth, dashboard, board detail, analytics, settings)
- 3 development phases (P1: MVP, P2: Enhanced, P3: Advanced)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Status**: ✅ PASSED (no constitution file exists - using standard best practices)

Since no project constitution exists at `.specify/memory/constitution.md`, we apply standard software engineering principles:

### Standard Quality Gates

1. **Architecture Simplicity**: ✅ PASS
   - Single Next.js project with integrated Convex backend (not over-engineered)
   - No unnecessary microservices or complex patterns
   - Leveraging platform capabilities (Next.js App Router, Convex real-time)

2. **Technology Choices**: ✅ PASS
   - Modern, stable stack: Next.js 14+, TypeScript, React 18+
   - Convex chosen for real-time sync requirement (simpler than building custom WebSocket infrastructure)
   - @convex-dev/auth for full control vs. vendor lock-in (Clerk)
   - All choices justified by functional requirements

3. **Testing Strategy**: ✅ PASS
   - Unit tests: Vitest for business logic and utilities
   - Integration tests: Convex functions, authentication flows
   - E2E tests: Playwright for critical user journeys
   - Clear testing boundaries defined

4. **Performance Requirements**: ✅ PASS
   - Measurable goals defined (< 2s heatmap load, < 1s check-in)
   - Constraints align with user expectations (99.9% accuracy, offline support)
   - Realistic for chosen stack

5. **Accessibility**: ✅ PASS
   - WCAG 2.1 AA compliance required
   - shadcn/ui provides accessible primitives
   - Keyboard navigation and screen reader support specified

**No violations identified**. Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
checker/
├── src/                         # Source code (Next.js application)
│   ├── app/                     # Next.js 14+ App Router
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── sign-in/
│   │   │   ├── sign-up/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── page.tsx         # Boards list (main dashboard)
│   │   │   ├── boards/[id]/     # Individual board detail + heatmap
│   │   │   ├── analytics/       # Global analytics across all boards
│   │   │   └── settings/        # User settings (profile, preferences)
│   │   ├── layout.tsx           # Root layout (providers, theme)
│   │   ├── page.tsx             # Landing page
│   │   └── providers.tsx        # Client providers (Convex, @convex-dev/auth)
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # shadcn/ui primitives (button, dialog, etc.)
│   │   ├── boards/              # Board-specific components
│   │   │   ├── board-card.tsx
│   │   │   ├── board-form.tsx
│   │   │   └── check-in-button.tsx
│   │   ├── analytics/           # Analytics and stats components
│   │   │   ├── heatmap-calendar.tsx
│   │   │   ├── streak-display.tsx
│   │   │   └── insights-panel.tsx
│   │   └── layout/              # Layout components (navbar, footer)
│   │
│   └── lib/                     # Shared utilities and hooks
│       ├── utils.ts             # Helper functions (cn, date formatting)
│       ├── constants.ts         # App constants (unit types, colors)
│       ├── types.ts             # Shared TypeScript types
│       ├── hooks/               # Custom React hooks
│       │   ├── use-check-in.ts
│       │   ├── use-streak.ts
│       │   └── use-offline-sync.ts
│       └── validations/         # Zod schemas for forms
│
├── convex/                      # Convex serverless backend
│   ├── schema.ts                # Database schema (users, boards, checkIns, etc.)
│   ├── boards.ts                # Board queries/mutations
│   ├── checkIns.ts              # Check-in operations
│   ├── users.ts                 # User management
│   ├── analytics.ts             # Analytics queries (streaks, completion rates)
│   ├── notifications.ts         # Reminder scheduling
│   └── http.ts                  # HTTP actions (webhooks, @convex-dev/auth integration)
│
├── specs/                       # Specification files (Specify workflow)
│   └── 001-habit-tracker/       # This feature
│       ├── spec.md              # Feature specification
│       ├── plan.md              # This file
│       ├── research.md          # Phase 0 output
│       ├── data-model.md        # Phase 1 output
│       ├── quickstart.md        # Phase 1 output
│       └── contracts/           # Phase 1 output (API contracts)
│
├── tests/                       # Test files
│   ├── unit/                    # Vitest unit tests
│   │   ├── lib/
│   │   └── convex/
│   ├── integration/             # Integration tests (auth flows, full workflows)
│   └── e2e/                     # Playwright E2E tests
│
├── public/                      # Static assets
└── docs/                        # Documentation
    ├── ARCHITECTURE.md
    └── API.md
```

**Structure Decision**: Next.js 14+ App Router with integrated Convex backend

**Rationale**:

- **App Router**: Leverages Next.js server components for better performance and SEO
- **Route groups**: `(auth)` and `(dashboard)` organize routes without affecting URL structure
- **Convex co-location**: Backend functions live in `/convex`, deployed separately but version-controlled together
- **Component organization**: Grouped by feature area (boards, analytics) rather than technical type
- **Type safety**: Convex generates TypeScript types automatically from schema
- **Testing separation**: Clear boundaries between unit, integration, and E2E tests

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified**. The architecture follows simplicity principles:

- Single Next.js application (not over-engineered with multiple services)
- Convex serverless backend eliminates infrastructure complexity
- @convex-dev/auth chosen for simplicity and control vs. vendor lock-in
- No unnecessary patterns or abstractions
- Technology choices justified by functional requirements

---

## Re-evaluation: Constitution Check (Post-Design)

**Status**: ✅ PASSED

After completing Phase 1 design (data model, contracts, quickstart), the architecture remains compliant with standard software engineering principles:

1. **Architecture Simplicity**: ✅ PASS
   - Data model is normalized, no over-engineering
   - 5 core entities with clear relationships
   - Leverages Convex's built-in features (indexing, real-time sync)

2. **API Design**: ✅ PASS
   - RESTful-style Convex functions (queries/mutations)
   - Clear separation of concerns (auth, boards, check-ins, analytics, notifications)
   - Consistent error handling and validation

3. **Database Schema**: ✅ PASS
   - Appropriate indexes for query patterns
   - Denormalization only where justified (streak caching in boards)
   - Cascade deletes properly defined

4. **Testing Strategy**: ✅ PASS
   - Multi-layer testing (unit, integration, E2E)
   - Clear test boundaries defined
   - Realistic for chosen stack

5. **Developer Experience**: ✅ PASS
   - Quick start guide enables fast onboarding
   - Type safety throughout (TypeScript + Convex)
   - Clear documentation structure

**No new violations introduced**. Architecture remains simple, justified, and maintainable.

---

## Plan Summary

### Phase 0: Research ✅ COMPLETE

- [research.md](./research.md) - All technology decisions researched and documented
- No NEEDS CLARIFICATION items remaining
- Best practices identified for each technology

### Phase 1: Design & Contracts ✅ COMPLETE

- [data-model.md](./data-model.md) - Database schema with 5 entities, validation rules, relationships
- [contracts/](./contracts/) - API contracts for all Convex functions (auth, boards, check-ins, analytics, notifications)
- [quickstart.md](./quickstart.md) - Development setup guide with first feature implementation
- Agent context updated with new tech stack

### Phase 2: Tasks Generation (NOT PART OF THIS COMMAND)

- Run `/speckit.tasks` to generate implementation tasks from this plan
- Tasks will be in `tasks.md` with dependency order

---

## Next Steps

1. **Review this plan**: Ensure technical decisions align with project goals
2. **Generate tasks**: Run `/speckit.tasks` to create implementation checklist
3. **Begin implementation**: Follow `quickstart.md` to set up development environment
4. **Implement MVP (P1)**: Focus on core user stories (create board, check in, view heatmap)

---

**Plan Status**: ✅ COMPLETE
**Branch**: `001-habit-tracker`
**Specification**: [spec.md](./spec.md)
**Generated Files**:

- ✅ plan.md (this file)
- ✅ research.md
- ✅ data-model.md
- ✅ contracts/ (README, auth, boards, check-ins, analytics, notifications)
- ✅ quickstart.md

**Ready for**: Task generation (`/speckit.tasks`)
