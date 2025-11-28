# Tasks: Habit Tracking Application

**Feature**: 001-habit-tracker
**Input**: Design documents from `/specs/001-habit-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are excluded from this list. Tests can be added later as needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project structure (from plan.md):

- **Frontend**: `app/`, `components/`, `lib/`
- **Backend**: `convex/`
- **Tests**: `tests/unit/`, `tests/integration/`, `tests/e2e/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic Next.js 16 + Convex structure with API testing tools

- [ ] T001 Initialize Next.js 16 project with TypeScript, Tailwind CSS, and Turbopack using Bun
- [ ] T002 Install core dependencies with Bun (next@16, react@19, convex, @convex-dev/auth, @tanstack/react-form, @tanstack/zod-form-adapter, zod, lucide-react, @uiw/react-heat-map, date-fns)
- [ ] T003 [P] Setup Biome for linting and formatting (biome.json with recommended rules, tab indents, double quotes)
- [ ] T004 [P] Add Biome scripts to package.json (lint, lint:fix, format)
- [ ] T005 [P] Initialize shadcn/ui and install base components (button, dialog, input, label, form, card, dropdown-menu, select, toast)
- [ ] T006 [P] Configure Tailwind CSS with design tokens (colors, spacing, typography) in tailwind.config.ts
- [ ] T007 Initialize Convex project with `bunx convex dev` and configure environment variables
- [ ] T008 [P] Setup @convex-dev/auth configuration in lib/auth.ts
- [ ] T009 [P] Create auth API route in app/api/auth/[...all]/route.ts
- [ ] T010 [P] Configure Next.js App Router structure with route groups (auth) and (dashboard)
- [ ] T011 Create root layout in app/layout.tsx with ConvexClientProvider
- [ ] T012 [P] Create ConvexClientProvider in providers/convex-provider.tsx
- [ ] T013 [P] Setup global CSS with theme variables in app/globals.css
- [ ] T014 [P] Create utility functions in lib/utils.ts (cn, date formatting helpers)
- [ ] T015 [P] Create constants file in lib/constants.ts (unit types, colors, emojis)
- [ ] T016 [P] Setup Bruno API client with collection structure in bruno/ directory (boards/, check-ins/, analytics/, environments/)
- [ ] T017 [P] Create OpenAPI/Swagger documentation route at app/api/docs/route.ts
- [ ] T018 [P] Install swagger-ui-express and create Swagger UI page
- [ ] T019 [P] Create Bruno environment configs in bruno/environments/ (local.bru, production.bru)

**Checkpoint**: Project structure ready - can run `bun dev --turbo` and see blank app, Swagger docs at /api/docs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T020 Create Convex database schema in convex/schema.ts (users, boards, checkIns with sessionNumber field, insights, notifications tables)
- [ ] T021 [P] Create user management functions in convex/users.ts (getCurrentUser, updateProfile, syncUserFromAuth, getUserStats queries/mutations)
- [ ] T022 [P] Implement authentication middleware/hooks in lib/hooks/use-auth.ts
- [ ] T023 [P] Create base UI components: Layout components in components/layout/ (navbar, footer, sidebar)
- [ ] T024 [P] Create Zod validation schemas in lib/validations/ (board.ts, checkin.ts) for TanStack Form integration
- [ ] T025 [P] Setup error handling and toast notifications system
- [ ] T026 [P] Create shared TypeScript types in lib/types.ts (Board, CheckIn, User, etc.)
- [ ] T027 [P] Setup environment configuration (.env.local template with CONVEX_URL, BETTER_AUTH_SECRET)
- [ ] T028 [P] Create Bruno request collection for authentication endpoints in bruno/auth/
- [ ] T029 [P] Update OpenAPI spec with authentication endpoints in specs/001-habit-tracker/contracts/openapi.yaml

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create and Track First Habit (Priority: P1) 🎯 MVP

**Goal**: Users can create a board, perform **multiple check-ins per day**, and see immediate visual feedback within 90 seconds

**Independent Test**: Create account → Create board "Morning Workout" → Click check-in button twice → See 2 sessions logged with updated daily total

### Implementation for User Story 1

- [ ] T030 [P] [US1] Create board mutations in convex/boards.ts (create, list, get)
- [ ] T031 [P] [US1] Create BoardForm component in components/boards/board-form.tsx with TanStack Form + Zod validation following modular patterns from forms-architecture.md
- [ ] T032 [P] [US1] Create BoardCard component in components/boards/board-card.tsx for displaying board summary
- [ ] T033 [US1] Create dashboard page in app/(dashboard)/page.tsx with board list and create dialog
- [ ] T034 [P] [US1] Create check-in mutation in convex/checkIns.ts with sessionNumber auto-increment logic
- [ ] T035 [US1] Implement daily total calculation (sum all amounts for today) in check-in mutation
- [ ] T036 [P] [US1] Create CheckInButton component in components/boards/check-in-button.tsx (clickable multiple times)
- [ ] T037 [P] [US1] Create countForToday query in convex/checkIns.ts (returns session count, daily total, target progress)
- [ ] T038 [US1] Implement streak calculation logic in convex/lib/streak-calculator.ts (based on daily totals reaching target)
- [ ] T039 [US1] Update check-in mutation to recalculate streaks based on daily totals
- [ ] T040 [US1] Add visual feedback showing session number and daily total (e.g., "Session 2/3 - 80/100 total")
- [ ] T041 [US1] Create authentication pages in app/(auth)/sign-in/page.tsx and app/(auth)/sign-up/page.tsx
- [ ] T042 [US1] Implement protected route middleware for dashboard routes
- [ ] T043 [P] [US1] Create Bruno requests for board endpoints in bruno/boards/
- [ ] T044 [P] [US1] Create Bruno requests for check-in endpoints in bruno/check-ins/

**Checkpoint**: Users can signup, create boards, check in **multiple times per day**, see session count and daily total - MVP complete!

---

## Phase 4: User Story 2 - View Progress Visualization (Priority: P1)

**Goal**: Users can see their habit completion history at a glance through a year-long heatmap calendar, with **aggregated daily totals for multiple check-ins**

**Independent Test**: Create board → Check in 3 times in one day (50+30+20=100) → Navigate to board detail page → See heatmap cell showing 3 sessions and 100 total

### Implementation for User Story 2

- [ ] T045 [P] [US2] Create getHeatmapData query in convex/checkIns.ts (aggregates multiple check-ins per day into daily totals)
- [ ] T046 [US2] Implement daily aggregation logic (group by date, sum amounts, count sessions)
- [ ] T047 [P] [US2] Create HeatmapCalendar component in components/analytics/heatmap-calendar.tsx using @uiw/react-heat-map
- [ ] T048 [US2] Create board detail page in app/(dashboard)/boards/[id]/page.tsx
- [ ] T049 [P] [US2] Implement heatmap tooltip showing session count and daily total (e.g., "3 sessions - 110/100 total")
- [ ] T050 [P] [US2] Add year selector UI for viewing different years
- [ ] T051 [US2] Configure heatmap color scale based on daily total vs target (intensity = min(1.0, total/target))
- [ ] T052 [P] [US2] Implement mobile responsive horizontal scrolling for heatmap
- [ ] T053 [US2] Handle leap years correctly (366 days) in heatmap rendering
- [ ] T054 [US2] Add loading states and skeleton UI for heatmap data
- [ ] T055 [P] [US2] Create listForDate query in convex/checkIns.ts (returns all sessions for a specific date)
- [ ] T056 [US2] Add session list modal when clicking heatmap cell (shows all sessions for that day)

**Checkpoint**: Users can view full-year heatmap with aggregated daily totals and session details

---

## Phase 5: User Story 3 - Track Habits with Quantities (Priority: P2)

**Goal**: Users can track measurable quantities (time, distance, volume, etc.) and see progress against goals

**Independent Test**: Create board with unit type "time" (minutes), target 30 min → Check in with 25 min → Check in with 35 min → View analytics showing average and target achievement

### Implementation for User Story 3

- [ ] T057 [P] [US3] Update BoardForm to support unit type selection and custom units in components/boards/board-form.tsx
- [ ] T058 [P] [US3] Add targetAmount field to board creation form
- [ ] T059 [US3] Update check-in mutation to validate amount based on board unit type in convex/checkIns.ts
- [ ] T060 [P] [US3] Create QuantityInput component in components/boards/quantity-input.tsx
- [ ] T061 [US3] Update CheckInButton to show quantity input when board has quantitative unit
- [ ] T062 [P] [US3] Update heatmap cell intensity calculation based on amount relative to target
- [ ] T063 [P] [US3] Display quantity and unit in heatmap tooltip
- [ ] T064 [US3] Update BoardCard to show daily target if set
- [ ] T065 [P] [US3] Add unit type icons/labels to board UI (time ⏱️, distance 📏, volume 🥤, etc.)

**Checkpoint**: Users can track quantitative habits with targets and see visual intensity based on amounts

---

## Phase 6: User Story 4 - Monitor Streaks and Statistics (Priority: P2)

**Goal**: Users can see current streak, longest streak, completion rates, and celebrate milestones

**Independent Test**: Create board → Check in for 5 consecutive days → Skip day → Check in for 3 days → See "Current Streak: 3 days" and "Longest Streak: 5 days"

### Implementation for User Story 4

- [ ] T066 [P] [US4] Create analytics queries in convex/analytics.ts (getBoardStats, getCompletionTrend)
- [ ] T067 [P] [US4] Create StreakDisplay component in components/analytics/streak-display.tsx
- [ ] T068 [P] [US4] Create StatsCard component in components/analytics/stats-card.tsx
- [ ] T069 [US4] Add stats section to board detail page showing current/longest streaks, total check-ins
- [ ] T070 [P] [US4] Implement completion rate calculation (7-day, 30-day, 90-day) in analytics queries
- [ ] T071 [P] [US4] Display completion rates in stats section
- [ ] T072 [P] [US4] Calculate and display average amount and total amount for quantitative boards
- [ ] T073 [P] [US4] Implement best day analysis (day-of-week with highest completion rate)
- [ ] T074 [US4] Add celebration animation/badge when new longest streak is achieved
- [ ] T075 [P] [US4] Update check-in mutation to return isNewRecord flag

**Checkpoint**: Users see comprehensive statistics and get celebration feedback on milestones

---

## Phase 7: User Story 5 - Manage Multiple Habit Boards (Priority: P2)

**Goal**: Users can track multiple habits simultaneously and see a dashboard overview

**Independent Test**: Create 3 boards ("Morning Run", "Read 30min", "Meditate") → Check in on each → View dashboard showing all 3 with individual stats

### Implementation for User Story 5

- [ ] T076 [P] [US5] Update dashboard page to display boards in grid layout with filters
- [ ] T077 [P] [US5] Implement board sorting options (by last check-in, current streak, name)
- [ ] T078 [P] [US5] Create global stats query in convex/analytics.ts (getGlobalStats)
- [ ] T079 [P] [US5] Create GlobalStatsPanel component in components/analytics/global-stats-panel.tsx
- [ ] T080 [US5] Add global stats to dashboard header (total boards, total check-ins, best streak)
- [ ] T081 [P] [US5] Implement board archiving mutation in convex/boards.ts (archive, restore)
- [ ] T082 [P] [US5] Add archive/restore actions to BoardCard dropdown menu
- [ ] T083 [P] [US5] Create archived boards view with toggle on dashboard
- [ ] T084 [US5] Implement board deletion mutation with cascade delete of check-ins
- [ ] T085 [US5] Add delete confirmation dialog with warning about data loss
- [ ] T086 [P] [US5] Create empty state UI for dashboard when no boards exist

**Checkpoint**: Users can manage multiple boards with archiving, deletion, and comprehensive overview

---

## Phase 8: User Story 6 - Edit Historical Check-ins (Priority: P3)

**Goal**: Users can add or edit past check-ins to maintain accurate records

**Independent Test**: Create board → Check in today → Navigate to yesterday on calendar → Click to add historical check-in with note "Forgot to log" → Calendar updates to show both days complete

### Implementation for User Story 6

- [ ] T087 [P] [US6] Add update mutation to convex/checkIns.ts (update amount and note)
- [ ] T088 [P] [US6] Add remove mutation to convex/checkIns.ts with streak recalculation
- [ ] T089 [P] [US6] Make heatmap cells clickable in HeatmapCalendar component
- [ ] T090 [P] [US6] Create CheckInDialog component in components/boards/check-in-dialog.tsx for add/edit
- [ ] T091 [US6] Implement historical check-in creation (allow past dates, prevent future dates)
- [ ] T092 [US6] Add edit mode to CheckInDialog when clicking existing check-in
- [ ] T093 [P] [US6] Add delete button to CheckInDialog with confirmation
- [ ] T094 [US6] Update streak calculation to handle historical edits/deletions
- [ ] T095 [P] [US6] Display last modified timestamp on edited check-ins (optional)
- [ ] T096 [US6] Add validation to prevent check-ins for future dates

**Checkpoint**: Users can correct historical data by adding, editing, or deleting past check-ins

---

## Phase 9: User Story 7 - Receive Habit Reminders (Priority: P3)

**Goal**: Users receive daily reminders at specific times to check in on their habits

**Independent Test**: Create board → Enable reminders for 9:00 AM → Verify reminder is scheduled → (Simulate) notification is triggered at 9 AM on days without check-in

### Implementation for User Story 7

- [ ] T097 [P] [US7] Create notification CRUD mutations in convex/notifications.ts (get, enable, disable, updateSchedule)
- [ ] T098 [P] [US7] Create NotificationToggle component in components/boards/notification-toggle.tsx
- [ ] T099 [P] [US7] Add reminder settings section to board settings/edit page
- [ ] T100 [US7] Implement browser notification permission request in client-side action
- [ ] T101 [P] [US7] Create scheduled function in convex/notifications.ts (sendDailyReminders runs hourly)
- [ ] T102 [US7] Implement reminder logic: check time, check if checked-in today, send notification
- [ ] T103 [P] [US7] Setup Web Push notification content (title, body, icon, actions)
- [ ] T104 [US7] Handle notification click to navigate to board detail page
- [ ] T105 [P] [US7] Add "Check In Now" action button to notification
- [ ] T106 [US7] Update lastSent timestamp after sending notification
- [ ] T107 [P] [US7] Create notifications settings page in app/(dashboard)/settings/notifications/page.tsx
- [ ] T108 [US7] Display all user notifications with enable/disable toggles

**Checkpoint**: Users receive timely reminders and can manage notification settings per board

---

## Phase 10: User Story 8 - Personalized Insights and Analytics (Priority: P3)

**Goal**: Users receive automated insights about their habit patterns to improve consistency

**Independent Test**: Create board with 30 days of varied data (weekdays vs weekends, different quantities) → View insights panel → See at least 3 insights like "Best day: Monday (90% completion)" and "Average streak length: 4.2 days"

### Implementation for User Story 8

- [ ] T109 [P] [US8] Create insights generation logic in convex/lib/insight-generator.ts
- [ ] T110 [P] [US8] Implement insight types: pattern detection (day-of-week analysis)
- [ ] T111 [P] [US8] Implement insight types: trend analysis (improving/declining completion rates)
- [ ] T112 [P] [US8] Implement insight types: achievement detection (new records, milestones)
- [ ] T113 [P] [US8] Implement insight types: suggestion generation (best times, consistency tips)
- [ ] T114 [US8] Create scheduled function in convex/analytics.ts (generateInsights runs daily)
- [ ] T115 [US8] Add minimum data check (requires 14+ days before generating insights)
- [ ] T116 [P] [US8] Create insights query in convex/analytics.ts (getInsights with board filter)
- [ ] T117 [P] [US8] Create InsightsPanel component in components/analytics/insights-panel.tsx
- [ ] T118 [US8] Add insights section to board detail page
- [ ] T119 [P] [US8] Create global insights view in app/(dashboard)/analytics/page.tsx
- [ ] T120 [P] [US8] Implement insight metadata (e.g., stats used, date range)
- [ ] T121 [US8] Add "insufficient data" message when < 14 days of check-ins

**Checkpoint**: Users receive personalized, actionable insights based on their habit patterns

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T122 [P] Implement dark/light theme toggle with user preference persistence
- [ ] T123 [P] Add theme auto-switching based on system preference
- [ ] T124 [P] Ensure WCAG 2.1 AA color contrast compliance across all components
- [ ] T125 [P] Add keyboard navigation support for all interactive elements
- [ ] T126 [P] Add ARIA labels for screen readers to all UI components
- [ ] T127 [P] Implement offline support: queue check-ins in IndexedDB when offline
- [ ] T128 [P] Add auto-sync when connection is restored with exponential backoff
- [ ] T129 [P] Create sync status indicator in UI (synced/syncing/pending)
- [ ] T130 [P] Implement optimistic UI updates for all mutations
- [ ] T131 [P] Add error boundary components for graceful error handling
- [ ] T132 [P] Create user settings page in app/(dashboard)/settings/page.tsx (profile, timezone, theme)
- [ ] T133 [P] Implement timezone detection and user timezone preference
- [ ] T134 [P] Add board edit functionality (update name, emoji, color, target)
- [ ] T135 [P] Create global analytics page in app/(dashboard)/analytics/page.tsx
- [ ] T136 [P] Add loading skeletons for all async data
- [ ] T137 [P] Implement error states with retry actions
- [ ] T138 [P] Add confirmation dialogs for destructive actions (delete board, delete check-in)
- [ ] T139 [P] Create landing page in app/page.tsx with feature showcase
- [ ] T140 [P] Add meta tags for SEO in layout files
- [ ] T141 [P] Implement completion trend line chart in analytics page
- [ ] T142 [P] Add export functionality (CSV export of check-in data per board)
- [ ] T143 [P] Create documentation in docs/ (ARCHITECTURE.md, API.md)
- [ ] T144 Validate app against quickstart.md test scenarios
- [ ] T145 [P] Performance optimization: lazy load heatmap for large datasets
- [ ] T146 [P] Performance optimization: implement virtual scrolling for long board lists
- [ ] T147 [P] Security audit: validate all input, sanitize user content
- [ ] T148 [P] Setup error tracking (e.g., Sentry integration)
- [ ] T149 [P] Setup analytics tracking (e.g., Vercel Analytics)

**Checkpoint**: Production-ready application with polish, accessibility, and cross-cutting features

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
  - Suggested MVP: US1 + US2 only (create boards, check in, view heatmap)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Create and Track First Habit - Can start after Foundational - No dependencies
- **US2 (P1)**: View Progress Visualization - Can start after Foundational - Integrates with US1 boards and check-ins
- **US3 (P2)**: Track Habits with Quantities - Can start after Foundational - Extends US1 and US2 with quantity tracking
- **US4 (P2)**: Monitor Streaks and Statistics - Can start after Foundational - Displays analytics from US1/US2 data
- **US5 (P2)**: Manage Multiple Habit Boards - Can start after Foundational - Extends US1 with board management
- **US6 (P3)**: Edit Historical Check-ins - Depends on US2 (heatmap UI) - Adds editing capabilities
- **US7 (P3)**: Receive Habit Reminders - Can start after Foundational - Independent notification system
- **US8 (P3)**: Personalized Insights - Depends on US4 (analytics foundation) - Adds AI-generated insights

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation (not applicable here)
- Models/schemas before services
- Mutations/queries before UI components
- Core components before page integration
- Story complete before moving to next priority

### Parallel Opportunities

**Setup Phase**:

- T003, T004, T006, T007, T008, T010, T011, T012, T013 can all run in parallel

**Foundational Phase**:

- T015, T016, T017, T018, T019, T020, T021 can all run in parallel

**User Story 1**:

- T022, T023, T024, T026, T027 can run in parallel
- T031, T032 can run in parallel

**User Story 2**:

- T034, T035, T037, T038, T040 can run in parallel

**User Story 3**:

- T043, T044, T046, T048, T049, T051 can run in parallel

**User Story 4**:

- T052, T053, T054, T056, T057, T058, T059 can run in parallel

**User Story 5**:

- T062, T063, T064, T065, T067, T068, T069, T072 can run in parallel

**User Story 6**:

- T073, T074, T075, T076, T079, T081 can run in parallel

**User Story 7**:

- T083, T084, T087, T089, T091, T093 can run in parallel

**User Story 8**:

- T095, T096, T097, T098, T099, T102, T103, T106 can run in parallel

**Polish Phase**:

- Most tasks in Phase 11 can run in parallel as they affect different files

**Cross-Story Parallelism**:

- After Foundational phase, different developers can work on different user stories simultaneously

---

## Parallel Example: User Story 1

```bash
# Launch parallel tasks for User Story 1:
Task: "Create board mutations in convex/boards.ts (create, list, get)" [T022]
Task: "Create BoardForm component in components/boards/board-form.tsx" [T023]
Task: "Create BoardCard component in components/boards/board-card.tsx" [T024]
Task: "Create check-in mutation in convex/checkIns.ts" [T026]
Task: "Create CheckInButton component in components/boards/check-in-button.tsx" [T027]

# Then sequential tasks that depend on above:
Task: "Create dashboard page in app/(dashboard)/page.tsx" [T025] (needs T023, T024)
Task: "Update check-in mutation to recalculate streaks" [T029] (needs T026, T028)
```

---

## Parallel Example: User Story 2

```bash
# Launch parallel tasks for User Story 2:
Task: "Create check-in list query in convex/checkIns.ts" [T034]
Task: "Create HeatmapCalendar component in components/analytics/heatmap-calendar.tsx" [T035]
Task: "Implement heatmap tooltip with date, count, notes" [T037]
Task: "Add year selector UI for viewing different years" [T038]
Task: "Implement mobile responsive horizontal scrolling" [T040]

# Then sequential:
Task: "Create board detail page in app/(dashboard)/boards/[id]/page.tsx" [T036] (needs T035)
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only) - Recommended

1. Complete Phase 1: Setup (T001-T013)
2. Complete Phase 2: Foundational (T014-T021) - CRITICAL
3. Complete Phase 3: User Story 1 (T022-T033) - Create boards and check in
4. Complete Phase 4: User Story 2 (T034-T042) - View heatmap
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo MVP (users can create boards, check in, see visual progress)

**Why this is MVP**: These two stories deliver the core value proposition - habit tracking with visual feedback. Users get immediate value and can start building habits.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Add User Story 7 → Test independently → Deploy/Demo
9. Add User Story 8 → Test independently → Deploy/Demo
10. Polish Phase → Final production release

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

**Sprint 1**:

- Dev A: User Story 1 (P1) - Create and Track
- Dev B: User Story 2 (P1) - Heatmap
- Dev C: Setup CI/CD, tooling, documentation

**Sprint 2**:

- Dev A: User Story 3 (P2) - Quantities
- Dev B: User Story 4 (P2) - Streaks/Stats
- Dev C: User Story 5 (P2) - Multiple Boards

**Sprint 3**:

- Dev A: User Story 6 (P3) - Historical Edits
- Dev B: User Story 7 (P3) - Reminders
- Dev C: User Story 8 (P3) - Insights

**Sprint 4**:

- All devs: Polish phase (accessibility, offline, performance)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story**: Should be independently completable and testable
- **No tests included**: Tests not explicitly requested in spec - add later if needed
- **Commit strategy**: Commit after each task or logical group
- **Checkpoints**: Stop at any checkpoint to validate story independently
- **File paths**: All paths are exact and based on plan.md structure
- **Tech stack**: Next.js 14+ App Router, TypeScript, Convex, @convex-dev/auth, shadcn/ui
- **Avoid**: Vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Count Summary

- **Phase 1 (Setup)**: 19 tasks (+4 for Next.js 16, Bruno, Swagger, +2 for Biome setup)
- **Phase 2 (Foundational)**: 10 tasks (+2 for Bruno collections, OpenAPI)
- **Phase 3 (US1 - P1)**: 15 tasks (+3 for multiple check-ins, sessionNumber, countForToday)
- **Phase 4 (US2 - P1)**: 12 tasks (+3 for aggregated heatmap, session list)
- **Phase 5 (US3 - P2)**: 9 tasks
- **Phase 6 (US4 - P2)**: 10 tasks
- **Phase 7 (US5 - P2)**: 11 tasks
- **Phase 8 (US6 - P3)**: 10 tasks
- **Phase 9 (US7 - P3)**: 12 tasks
- **Phase 10 (US8 - P3)**: 13 tasks
- **Phase 11 (Polish)**: 28 tasks

**Total**: 149 tasks (+14 new tasks for multiple check-ins, Bruno, Swagger, Next.js 16, Biome, Bun)

**MVP Scope (US1 + US2)**: 56 tasks (Setup + Foundational + US1 + US2)
**P1 Complete (US1 + US2)**: 56 tasks
**P2 Complete (+ US3, US4, US5)**: 86 tasks
**P3 Complete (+ US6, US7, US8)**: 121 tasks
**Production Ready (+ Polish)**: 149 tasks

**New capabilities added**:

- ✅ Multiple check-ins per day with session tracking
- ✅ Daily total aggregation and target progress
- ✅ Next.js 16 with Turbopack and React 19
- ✅ Bruno API testing (git-friendly, offline)
- ✅ Swagger/OpenAPI documentation
- ✅ Enhanced heatmap showing session counts
- ✅ Bun runtime for faster package management and testing
- ✅ Biome for fast linting and formatting (replaces ESLint + Prettier)

---

**Generated**: 2025-11-14
**Branch**: 001-habit-tracker
**Specification**: [spec.md](./spec.md)
**Implementation Plan**: [plan.md](./plan.md)

**Ready for**: Implementation - Start with Phase 1 (Setup)
