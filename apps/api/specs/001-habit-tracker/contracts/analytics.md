# Analytics Contracts

This file defines analytics queries for statistics, insights, and reports.

---

## getBoardStats

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field               | Type                  | Description                                               |
| ------------------- | --------------------- | --------------------------------------------------------- |
| `currentStreak`     | `number`              | Current consecutive days                                  |
| `longestStreak`     | `number`              | All-time best streak                                      |
| `totalCheckIns`     | `number`              | Total check-ins                                           |
| `completionRate7d`  | `number`              | % of last 7 days with check-ins                           |
| `completionRate30d` | `number`              | % of last 30 days with check-ins                          |
| `completionRate90d` | `number`              | % of last 90 days with check-ins                          |
| `averageAmount`     | `number \| undefined` | Average quantity (if quantitative)                        |
| `totalAmount`       | `number \| undefined` | Sum of all amounts (if quantitative)                      |
| `bestDay`           | `string \| undefined` | Day of week with highest completion rate (e.g., "Monday") |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const stats = useQuery(api.analytics.getBoardStats, {
  boardId: "b1234567890abcdef"
});

// Response
{
  currentStreak: 8,
  longestStreak: 14,
  totalCheckIns: 42,
  completionRate7d: 85.7,   // 6 out of 7 days
  completionRate30d: 73.3,  // 22 out of 30 days
  completionRate90d: 68.9,  // 62 out of 90 days
  averageAmount: 32.5,      // For quantitative boards
  totalAmount: 1365,
  bestDay: "Monday"         // Most consistent day
}
```

### Implementation Notes

- Displayed on board detail page
- Completion rates calculated as: (days with check-ins / total days) \* 100
- `bestDay` determined by analyzing day-of-week patterns over last 90 days
- Real-time subscription updates as check-ins are added

---

## getGlobalStats

**Type**: Query
**Auth Required**: Yes

### Arguments

None

### Returns

| Field               | Type                 | Description                              |
| ------------------- | -------------------- | ---------------------------------------- |
| `totalBoards`       | `number`             | Total boards (active + archived)         |
| `activeBoards`      | `number`             | Active boards count                      |
| `totalCheckIns`     | `number`             | Total check-ins across all boards        |
| `bestStreak`        | `number`             | Highest current streak across all boards |
| `longestStreakEver` | `number`             | Best streak record across all boards     |
| `checkInsToday`     | `number`             | Check-ins performed today                |
| `checkInsThisWeek`  | `number`             | Check-ins this week                      |
| `checkInsThisMonth` | `number`             | Check-ins this month                     |
| `mostActiveBoard`   | `Board \| undefined` | Board with most check-ins                |

### Errors

- Not authenticated → `"Unauthenticated"`

### Example

```typescript
// Request
const globalStats = useQuery(api.analytics.getGlobalStats);

// Response
{
  totalBoards: 5,
  activeBoards: 3,
  totalCheckIns: 142,
  bestStreak: 8,
  longestStreakEver: 28,
  checkInsToday: 2,
  checkInsThisWeek: 12,
  checkInsThisMonth: 45,
  mostActiveBoard: {
    _id: "b1234567890abcdef",
    name: "Morning Workout",
    totalCheckIns: 42,
    // ... other fields
  }
}
```

### Implementation Notes

- Displayed on main dashboard or analytics page
- Aggregates data across all user's boards
- Real-time subscription updates as check-ins are added

---

## getInsights

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description                          | Validation     |
| --------- | -------------- | -------- | ------------------------------------ | -------------- |
| `boardId` | `Id<"boards">` | No       | Board ID (optional, omit for global) | Valid board ID |
| `limit`   | `number`       | No       | Max insights to return               | Defaults to 5  |

### Returns

| Field                    | Type        | Description        |
| ------------------------ | ----------- | ------------------ |
| Array of Insight objects | `Insight[]` | Generated insights |

**Insight Object**:

| Field           | Type                  | Description         |
| --------------- | --------------------- | ------------------- |
| `_id`           | `Id<"insights">`      | Insight ID          |
| `type`          | `string`              | Insight category    |
| `message`       | `string`              | Human-readable text |
| `dateGenerated` | `number`              | Timestamp           |
| `metadata`      | `object \| undefined` | Additional data     |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found (if boardId provided) → `"Board not found"`

### Example

```typescript
// Request (board-specific)
const insights = useQuery(api.analytics.getInsights, {
  boardId: "b1234567890abcdef",
  limit: 3,
});

// Response
[
  {
    _id: "i1234567890abcdef",
    type: "pattern",
    message: "You're most consistent on Mondays (90% completion rate)",
    dateGenerated: 1699964800000,
    metadata: { dayOfWeek: "Monday", rate: 0.9 },
  },
  {
    _id: "i2234567890abcdef",
    type: "trend",
    message: "Your average check-in time has improved by 15% this month",
    dateGenerated: 1699878400000,
    metadata: { improvement: 0.15 },
  },
  {
    _id: "i3234567890abcdef",
    type: "achievement",
    message: "🎉 New longest streak record: 14 days!",
    dateGenerated: 1699792000000,
    metadata: { streak: 14 },
  },
];
```

### Implementation Notes

- Insights auto-generated by scheduled Convex function (runs daily)
- Requires minimum 14 days of data before generating insights
- Types of insights:
  - **pattern**: Day-of-week, time-of-day patterns
  - **achievement**: Milestones (new records, 100th check-in, etc.)
  - **trend**: Improvements or declines over time
  - **suggestion**: Actionable recommendations
- Displayed in analytics panel on board detail page

---

## getCompletionTrend

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description               | Validation     |
| --------- | -------------- | -------- | ------------------------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID                  | Valid board ID |
| `period`  | `number`       | No       | Number of days to analyze | Defaults to 90 |

### Returns

| Field                   | Type               | Description             |
| ----------------------- | ------------------ | ----------------------- |
| Array of TrendDataPoint | `TrendDataPoint[]` | Weekly completion rates |

**TrendDataPoint Object**:

| Field            | Type     | Description                  |
| ---------------- | -------- | ---------------------------- |
| `week`           | `string` | Week start date (YYYY-MM-DD) |
| `completionRate` | `number` | % of days with check-ins     |
| `checkInCount`   | `number` | Number of check-ins in week  |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const trend = useQuery(api.analytics.getCompletionTrend, {
  boardId: "b1234567890abcdef",
  period: 90,
});

// Response
[
  { week: "2025-08-26", completionRate: 57.1, checkInCount: 4 },
  { week: "2025-09-02", completionRate: 71.4, checkInCount: 5 },
  { week: "2025-09-09", completionRate: 85.7, checkInCount: 6 },
  { week: "2025-09-16", completionRate: 100, checkInCount: 7 },
  // ... more weeks
];
```

### Implementation Notes

- Used to render line chart showing progress over time
- Groups check-ins by week (Sunday to Saturday)
- Helps visualize improvement or decline
- Real-time subscription updates as check-ins are added

---

## getDailyAggregates

**Type**: Query
**Auth Required**: Yes

**Note**: Returns aggregated daily statistics for multiple check-ins per day. Useful for detailed analytics and reports.

### Arguments

| Parameter | Type           | Required | Description    | Validation               |
| --------- | -------------- | -------- | -------------- | ------------------------ |
| `boardId` | `Id<"boards">` | Yes      | Board ID       | Valid board ID           |
| `year`    | `number`       | No       | Filter by year | Defaults to current year |

### Returns

| Field                   | Type               | Description      |
| ----------------------- | ------------------ | ---------------- |
| Array of DailyAggregate | `DailyAggregate[]` | Daily statistics |

**DailyAggregate Object**:

| Field              | Type      | Description                    |
| ------------------ | --------- | ------------------------------ |
| `date`             | `string`  | Date (YYYY-MM-DD)              |
| `checkInCount`     | `number`  | Number of check-in sessions    |
| `totalAmount`      | `number`  | Sum of all amounts for the day |
| `achievedTarget`   | `boolean` | Whether daily total >= target  |
| `firstCheckInTime` | `string`  | Time of first check-in (HH:mm) |
| `lastCheckInTime`  | `string`  | Time of last check-in (HH:mm)  |
| `averageAmount`    | `number`  | Average amount per session     |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const dailyStats = useQuery(api.analytics.getDailyAggregates, {
  boardId: "b1234567890abcdef",
  year: 2025
});

// Response (quantitative tracking - board with target = 100 push-ups/day)
[
  {
    date: "2025-11-14",
    checkInCount: 3, // 3 sessions today
    totalAmount: 120, // 50 + 40 + 30 = 120
    achievedTarget: true, // 120 >= 100
    firstCheckInTime: "08:30",
    lastCheckInTime: "20:15",
    averageAmount: 40 // 120 / 3 = 40
  },
  {
    date: "2025-11-13",
    checkInCount: 2,
    totalAmount: 80,
    achievedTarget: false, // 80 < 100
    firstCheckInTime: "09:00",
    lastCheckInTime: "18:45",
    averageAmount: 40
  },
  // ... more days
]

// Response (boolean tracking)
[
  {
    date: "2025-11-14",
    checkInCount: 2, // 2 sessions
    totalAmount: 2,
    achievedTarget: true, // Any check-in counts
    firstCheckInTime: "07:00",
    lastCheckInTime: "19:30",
    averageAmount: 1
  },
]
```

### Implementation Notes

- Groups all check-ins by date
- Calculates aggregate stats per day
- firstCheckInTime = earliest timestamp of the day
- lastCheckInTime = latest timestamp of the day
- Used for detailed analytics page showing session patterns
- Can identify if user prefers morning vs evening check-ins

---

## generateInsights

**Type**: Action (Scheduled)
**Auth Required**: No (internal scheduled job)

### Arguments

None (runs for all users)

### Returns

| Field               | Type     | Description               |
| ------------------- | -------- | ------------------------- |
| `insightsGenerated` | `number` | Count of insights created |

### Errors

None (logs errors internally)

### Implementation Notes

- Runs daily via Convex scheduled function
- For each user with >= 14 days of data:
  1. Analyze check-in patterns (day-of-week, time-of-day)
  2. Calculate trends (improving/declining completion rates)
  3. Detect achievements (new records, milestones)
  4. Generate actionable suggestions
- Creates new `insights` records in database
- Does not regenerate existing insights (idempotent)

**Insight Generation Logic**:

```typescript
// Pattern insights
if (mondayCompletionRate > avgCompletionRate * 1.2) {
  createInsight({
    type: "pattern",
    message: `You're most consistent on Mondays (${mondayCompletionRate}% completion rate)`
  });
}

// Trend insights
const last30Days = getCompletionRate(30);
const previous30Days = getCompletionRate(60, 30);
if (last30Days > previous30Days * 1.1) {
  createInsight({
    type: "trend",
    message: "Your consistency has improved by ${improvement}% this month!"
  });
}

// Achievement insights
if (currentStreak > longestStreak) {
  createInsight({
    type: "achievement",
    message: "🎉 New longest streak record: ${currentStreak} days!"
  });
}

// Suggestion insights
if (avgCheckInTime > 18:00 && morningCompletionRate > eveningCompletionRate) {
  createInsight({
    type: "suggestion",
    message: "Try checking in earlier - you're more consistent in the morning"
  });
}
```
