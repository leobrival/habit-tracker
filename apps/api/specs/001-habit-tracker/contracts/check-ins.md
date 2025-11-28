# Check-in Contracts

This file defines check-in operations (create, update, delete, list).

---

## create

**Type**: Mutation
**Auth Required**: Yes

**Note**: **Multiple check-ins per day are allowed**. Each click creates a new check-in session.

### Arguments

| Parameter | Type           | Required    | Description                | Validation                                        |
| --------- | -------------- | ----------- | -------------------------- | ------------------------------------------------- |
| `boardId` | `Id<"boards">` | Yes         | Board ID                   | Valid board ID                                    |
| `date`    | `string`       | No          | Check-in date (YYYY-MM-DD) | Defaults to today, cannot be future               |
| `amount`  | `number`       | Conditional | Quantity tracked           | Required for quantitative units, must be positive |
| `note`    | `string`       | No          | Optional note              | Max 500 chars                                     |

### Returns

| Field           | Type             | Description                                  |
| --------------- | ---------------- | -------------------------------------------- |
| `checkInId`     | `Id<"checkIns">` | Created check-in ID                          |
| `sessionNumber` | `number`         | Session number for today (1, 2, 3...)        |
| `dailyTotal`    | `number`         | Total amount for today (sum of all sessions) |
| `targetReached` | `boolean`        | Whether daily total >= target amount         |
| `currentStreak` | `number`         | Updated current streak                       |
| `longestStreak` | `number`         | Updated longest streak (if new record)       |
| `isNewRecord`   | `boolean`        | Whether longest streak was broken            |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Future date → `"Cannot check in for future dates"`
- Missing amount → `"Amount is required for quantitative tracking"`
- Invalid amount → `"Amount must be a positive number"`
- Note too long → `"Note must be 500 characters or less"`

### Example

```typescript
// Request (boolean tracking - first check-in of the day)
const result = await createCheckIn({
  boardId: "b1234567890abcdef"
});

// Response
{
  checkInId: "c1234567890abcdef",
  sessionNumber: 1,
  dailyTotal: 1,
  targetReached: true, // Any check-in counts for boolean
  currentStreak: 8,
  longestStreak: 14,
  isNewRecord: false
}

// Request (quantitative tracking - first session)
const result = await createCheckIn({
  boardId: "b2234567890abcdef", // Board with target = 100 push-ups/day
  amount: 50,
  note: "Morning session"
});

// Response
{
  checkInId: "c2234567890abcdef",
  sessionNumber: 1,
  dailyTotal: 50,
  targetReached: false, // 50 < 100 (target not reached yet)
  currentStreak: 0, // Streak won't count until target is reached
  longestStreak: 15,
  isNewRecord: false
}

// Request (second session same day)
const result = await createCheckIn({
  boardId: "b2234567890abcdef",
  amount: 60,
  note: "Evening session"
});

// Response
{
  checkInId: "c3234567890abcdef",
  sessionNumber: 2, // Second session of the day
  dailyTotal: 110, // 50 + 60 = 110
  targetReached: true, // 110 >= 100 ✅
  currentStreak: 5, // Streak now counts!
  longestStreak: 16,
  isNewRecord: true // New longest streak record! 🎉
}
```

### Implementation Notes

- Automatically calculates current time and user's timezone
- Date defaults to "today" in user's timezone if not provided
- **sessionNumber** is auto-incremented: finds max(sessionNumber) for this date and adds 1
- **dailyTotal** is calculated by summing all amounts for this date
- **targetReached** determines if day counts for streak (dailyTotal >= targetAmount)
- Recalculates streaks immediately (server-side) based on daily totals
- Triggers board stats update (currentStreak, longestStreak, totalCheckIns, lastCheckInDate)
- Shows celebration animation if `isNewRecord === true`
- **No uniqueness check** - multiple check-ins per day are allowed and expected

---

## list

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter        | Type             | Required | Description        | Validation               |
| ---------------- | ---------------- | -------- | ------------------ | ------------------------ |
| `boardId`        | `Id<"boards">`   | Yes      | Board ID           | Valid board ID           |
| `year`           | `number`         | No       | Filter by year     | Defaults to current year |
| `paginationOpts` | `PaginationOpts` | No       | Pagination options | Convex pagination        |

### Returns

| Field                    | Type        | Description         |
| ------------------------ | ----------- | ------------------- |
| Array of CheckIn objects | `CheckIn[]` | Check-ins for board |

**CheckIn Object**:

| Field       | Type                  | Description                |
| ----------- | --------------------- | -------------------------- |
| `_id`       | `Id<"checkIns">`      | Check-in ID                |
| `date`      | `string`              | Check-in date (YYYY-MM-DD) |
| `timestamp` | `number`              | Unix timestamp             |
| `amount`    | `number \| undefined` | Quantity (if applicable)   |
| `note`      | `string \| undefined` | Optional note              |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const checkIns = useQuery(api.checkIns.list, {
  boardId: "b1234567890abcdef",
  year: 2025,
});

// Response
[
  {
    _id: "c1234567890abcdef",
    date: "2025-11-14",
    timestamp: 1699964800000,
    amount: undefined,
    note: undefined,
  },
  {
    _id: "c2234567890abcdef",
    date: "2025-11-13",
    timestamp: 1699878400000,
    amount: 35,
    note: "Great session!",
  },
  // ... more check-ins
];
```

### Implementation Notes

- Used to populate heatmap calendar
- Efficient query using `by_board` index
- Real-time subscription updates heatmap as check-ins are added
- Pagination for very active boards (1000+ check-ins)

---

## update

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter   | Type             | Required | Description | Validation        |
| ----------- | ---------------- | -------- | ----------- | ----------------- |
| `checkInId` | `Id<"checkIns">` | Yes      | Check-in ID | Valid check-in ID |
| `amount`    | `number`         | No       | New amount  | Positive number   |
| `note`      | `string`         | No       | New note    | Max 500 chars     |

### Returns

| Field     | Type      | Description             |
| --------- | --------- | ----------------------- |
| `success` | `boolean` | Always `true`           |
| `checkIn` | `CheckIn` | Updated check-in object |

### Errors

- Not authenticated → `"Unauthenticated"`
- Check-in not found → `"Check-in not found"`
- Unauthorized → `"Unauthorized"`
- Invalid amount → `"Amount must be a positive number"`
- Note too long → `"Note must be 500 characters or less"`

### Example

```typescript
// Request
const result = await updateCheckIn({
  checkInId: "c1234567890abcdef",
  amount: 40,
  note: "Updated amount"
});

// Response
{
  success: true,
  checkIn: {
    _id: "c1234567890abcdef",
    date: "2025-11-14",
    amount: 40,
    note: "Updated amount",
    // ... other fields
  }
}
```

### Implementation Notes

- Can update `amount` and `note` only (cannot change date)
- Recalculates streaks if amount changed affects whether daily target was reached (streaks based on dailyTotal >= targetAmount)
- Updates heatmap cell intensity if amount changed
- For boolean boards (no target), any check-in counts for streak

---

## remove

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter   | Type             | Required | Description | Validation        |
| ----------- | ---------------- | -------- | ----------- | ----------------- |
| `checkInId` | `Id<"checkIns">` | Yes      | Check-in ID | Valid check-in ID |

### Returns

| Field           | Type      | Description                 |
| --------------- | --------- | --------------------------- |
| `success`       | `boolean` | Always `true`               |
| `currentStreak` | `number`  | Recalculated current streak |
| `longestStreak` | `number`  | Updated longest streak      |

### Errors

- Not authenticated → `"Unauthenticated"`
- Check-in not found → `"Check-in not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const result = await removeCheckIn({
  checkInId: "c1234567890abcdef"
});

// Response
{
  success: true,
  currentStreak: 6, // Decreased by 1
  longestStreak: 14 // Unchanged (historical max)
}
```

### Implementation Notes

- Recalculates streaks after deletion based on whether remaining daily total still reaches target
- If deleting a session breaks the daily total below target, the day no longer counts for streak
- Updates board stats (currentStreak, totalCheckIns, lastCheckInDate)
- Cannot delete another user's check-ins
- Used for correcting mistakes or removing erroneous entries

---

## listForDate

**Type**: Query
**Auth Required**: Yes

**Note**: Returns **all check-ins for a specific date** (can be multiple sessions).

### Arguments

| Parameter | Type           | Required | Description       | Validation        |
| --------- | -------------- | -------- | ----------------- | ----------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID          | Valid board ID    |
| `date`    | `string`       | Yes      | Date (YYYY-MM-DD) | Valid date format |

### Returns

| Field                    | Type        | Description                                       |
| ------------------------ | ----------- | ------------------------------------------------- |
| Array of CheckIn objects | `CheckIn[]` | All check-ins for this date, ordered by timestamp |

**CheckIn Object**:

| Field           | Type                  | Description                 |
| --------------- | --------------------- | --------------------------- |
| `_id`           | `Id<"checkIns">`      | Check-in ID                 |
| `date`          | `string`              | Date (YYYY-MM-DD)           |
| `timestamp`     | `number`              | Unix timestamp              |
| `amount`        | `number \| undefined` | Quantity (if applicable)    |
| `note`          | `string \| undefined` | Note                        |
| `sessionNumber` | `number`              | Session number (1, 2, 3...) |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Invalid date → `"Invalid date format"`

### Example

```typescript
// Request
const checkIns = useQuery(api.checkIns.listForDate, {
  boardId: "b1234567890abcdef",
  date: "2025-11-14"
});

// Response (multiple check-ins for same day)
[
  {
    _id: "c1234567890abcdef",
    date: "2025-11-14",
    timestamp: 1699964800000, // 9:00 AM
    amount: 50,
    note: "Morning session",
    sessionNumber: 1
  },
  {
    _id: "c2234567890abcdef",
    date: "2025-11-14",
    timestamp: 1700008000000, // 9:00 PM
    amount: 60,
    note: "Evening session",
    sessionNumber: 2
  }
]

// Response (no check-ins)
[]
```

### Implementation Notes

- Efficient query using `by_board_date` composite index
- Ordered by timestamp ascending (earliest first)
- Returns empty array if no check-ins for that date
- Used to display session list in UI

---

## countForToday

**Type**: Query
**Auth Required**: Yes

**Note**: Returns count and daily total for today's check-ins.

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field             | Type                  | Description                          |
| ----------------- | --------------------- | ------------------------------------ |
| `count`           | `number`              | Number of check-in sessions today    |
| `dailyTotal`      | `number`              | Sum of all amounts today             |
| `target`          | `number \| undefined` | Board's target amount                |
| `targetReached`   | `boolean`             | Whether dailyTotal >= target         |
| `remainingAmount` | `number \| undefined` | How much more needed to reach target |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const todayStats = useQuery(api.checkIns.countForToday, {
  boardId: "b1234567890abcdef"
});

// Response (board with target = 100)
{
  count: 2, // 2 check-in sessions today
  dailyTotal: 110, // 50 + 60 = 110
  target: 100,
  targetReached: true,
  remainingAmount: 0 // Already exceeded target
}

// Response (partial progress)
{
  count: 1,
  dailyTotal: 40,
  target: 100,
  targetReached: false,
  remainingAmount: 60 // Need 60 more to reach target
}

// Response (boolean tracking, no target)
{
  count: 3, // 3 check-ins today
  dailyTotal: 3,
  target: undefined,
  targetReached: true, // Any check-in counts
  remainingAmount: undefined
}
```

### Implementation Notes

- Used to display progress indicator in UI ("40/100 push-ups today")
- Real-time subscription updates as user checks in
- Calculates remainingAmount = max(0, target - dailyTotal)

---

## getForDate

**Type**: Query
**Auth Required**: Yes

**DEPRECATED**: Use `listForDate` instead. This endpoint returns only the first check-in for a date.

### Arguments

| Parameter | Type           | Required | Description       | Validation        |
| --------- | -------------- | -------- | ----------------- | ----------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID          | Valid board ID    |
| `date`    | `string`       | Yes      | Date (YYYY-MM-DD) | Valid date format |

### Returns

| Field                  | Type              | Description                        |
| ---------------------- | ----------------- | ---------------------------------- |
| CheckIn object or null | `CheckIn \| null` | Check-in for date, or null if none |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Invalid date → `"Invalid date format"`

### Example

```typescript
// Request
const checkIn = useQuery(api.checkIns.getForDate, {
  boardId: "b1234567890abcdef",
  date: "2025-11-14"
});

// Response (if exists)
{
  _id: "c1234567890abcdef",
  date: "2025-11-14",
  timestamp: 1699964800000,
  amount: 35,
  note: "Morning session"
}

// Response (if no check-in)
null
```

### Implementation Notes

- Used to check if user already checked in for a specific date
- Efficient query using `by_board_date` composite index
- Disables check-in button if result is not null

---

## getHeatmapData

**Type**: Query
**Auth Required**: Yes

**Note**: Aggregates multiple check-ins per day into daily totals for heatmap visualization.

### Arguments

| Parameter | Type           | Required | Description | Validation              |
| --------- | -------------- | -------- | ----------- | ----------------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID          |
| `year`    | `number`       | Yes      | Year        | Valid year (e.g., 2025) |

### Returns

| Field                | Type            | Description                |
| -------------------- | --------------- | -------------------------- |
| Array of HeatmapCell | `HeatmapCell[]` | Data for heatmap rendering |

**HeatmapCell Object**:

| Field           | Type      | Description                              |
| --------------- | --------- | ---------------------------------------- |
| `date`          | `string`  | Date (YYYY-MM-DD)                        |
| `count`         | `number`  | Number of check-in sessions for this day |
| `total`         | `number`  | Sum of all amounts for this day          |
| `targetReached` | `boolean` | Whether daily total >= target            |
| `sessions`      | `number`  | Number of sessions (same as count)       |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const heatmapData = useQuery(api.checkIns.getHeatmapData, {
  boardId: "b1234567890abcdef",
  year: 2025
});

// Response (board with quantitative tracking, target = 100)
[
  {
    date: "2025-01-01",
    count: 1,
    total: 120,
    targetReached: true,
    sessions: 1
  },
  {
    date: "2025-01-02",
    count: 2, // 2 sessions this day
    total: 110, // 50 + 60 = 110
    targetReached: true,
    sessions: 2
  },
  {
    date: "2025-01-03",
    count: 1,
    total: 70,
    targetReached: false, // 70 < 100
    sessions: 1
  },
  // ... one entry per day with activity
]

// Response (boolean tracking)
[
  {
    date: "2025-01-01",
    count: 1,
    total: 1,
    targetReached: true, // Any check-in counts
    sessions: 1
  },
  {
    date: "2025-01-02",
    count: 3, // 3 sessions
    total: 3,
    targetReached: true,
    sessions: 3
  },
]
```

### Implementation Notes

- **Aggregates multiple check-ins per day** into single heatmap cell
- Heatmap cell intensity based on `targetReached` or `total` value
- Returns only days with activity (client fills gaps with empty cells)
- Real-time subscription updates heatmap as check-ins are added
- For quantitative boards: color intensity = min(1.0, total / target)
- For boolean boards: color intensity = 1.0 if any check-in, 0.0 otherwise
