# Board Management Contracts

This file defines board CRUD operations and management functions.

---

## list

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter         | Type      | Required | Description             | Validation          |
| ----------------- | --------- | -------- | ----------------------- | ------------------- |
| `includeArchived` | `boolean` | No       | Include archived boards | Defaults to `false` |

### Returns

| Field                  | Type      | Description                                |
| ---------------------- | --------- | ------------------------------------------ |
| Array of Board objects | `Board[]` | User's boards sorted by last check-in desc |

**Board Object**:

| Field             | Type                  | Description                     |
| ----------------- | --------------------- | ------------------------------- |
| `_id`             | `Id<"boards">`        | Board ID                        |
| `name`            | `string`              | Board name                      |
| `emoji`           | `string \| undefined` | Emoji icon                      |
| `color`           | `string \| undefined` | Color hex code                  |
| `unitType`        | `string`              | Tracking unit type              |
| `unit`            | `string \| undefined` | Custom unit label               |
| `targetAmount`    | `number \| undefined` | Daily target                    |
| `currentStreak`   | `number`              | Current streak (days)           |
| `longestStreak`   | `number`              | All-time best streak            |
| `totalCheckIns`   | `number`              | Total check-ins                 |
| `lastCheckInDate` | `string \| undefined` | Last check-in date (YYYY-MM-DD) |
| `isArchived`      | `boolean`             | Archive status                  |

### Errors

- Not authenticated → `"Unauthenticated"`

### Example

```typescript
// Request
const boards = useQuery(api.boards.list, { includeArchived: false });

// Response
[
  {
    _id: "b1234567890abcdef",
    name: "Morning Workout",
    emoji: "💪",
    color: "#3B82F6",
    unitType: "boolean",
    currentStreak: 7,
    longestStreak: 14,
    totalCheckIns: 42,
    lastCheckInDate: "2025-11-14",
    isArchived: false,
  },
  {
    _id: "b2234567890abcdef",
    name: "Read 30min",
    emoji: "📚",
    unitType: "time",
    unit: "minutes",
    targetAmount: 30,
    currentStreak: 3,
    longestStreak: 10,
    totalCheckIns: 25,
    lastCheckInDate: "2025-11-13",
    isArchived: false,
  },
];
```

### Implementation Notes

- Sorted by `lastCheckInDate` descending (most recent first)
- Real-time subscription auto-updates as boards are created/modified
- Efficient index query: `by_user_active` for active-only filtering

---

## get

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field        | Type    | Description        |
| ------------ | ------- | ------------------ |
| Board object | `Board` | Full board details |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized (not owner) → `"Unauthorized"`

### Example

```typescript
// Request
const board = useQuery(api.boards.get, { boardId: "b1234567890abcdef" });

// Response
{
  _id: "b1234567890abcdef",
  userId: "u1234567890abcdef",
  name: "Morning Workout",
  description: "Track daily exercise routine",
  emoji: "💪",
  color: "#3B82F6",
  unitType: "boolean",
  currentStreak: 7,
  longestStreak: 14,
  totalCheckIns: 42,
  lastCheckInDate: "2025-11-14",
  isArchived: false,
  _creationTime: 1699564800000
}
```

### Implementation Notes

- Used on board detail page
- Real-time subscription updates stats as check-ins are added
- Authorization check ensures user owns board

---

## create

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter      | Type     | Required    | Description       | Validation                       |
| -------------- | -------- | ----------- | ----------------- | -------------------------------- |
| `name`         | `string` | Yes         | Board name        | 1-50 chars, unique per user      |
| `description`  | `string` | No          | Board description | Max 500 chars                    |
| `emoji`        | `string` | No          | Emoji icon        | Single emoji character           |
| `color`        | `string` | No          | Color theme       | Valid hex color                  |
| `unitType`     | `string` | Yes         | Unit type         | See unit types enum              |
| `unit`         | `string` | Conditional | Custom unit label | Required if unitType is "custom" |
| `targetAmount` | `number` | No          | Daily target      | Positive number                  |

**Unit Types**: `"boolean"` \| `"time"` \| `"distance"` \| `"volume"` \| `"mass"` \| `"calories"` \| `"money"` \| `"percentage"` \| `"custom"`

### Returns

| Field     | Type           | Description               |
| --------- | -------------- | ------------------------- |
| `boardId` | `Id<"boards">` | Created board ID          |
| `board`   | `Board`        | Full created board object |

### Errors

- Not authenticated → `"Unauthenticated"`
- Name already exists → `"A board with this name already exists"`
- Name too short/long → `"Board name must be 1-50 characters"`
- Invalid unitType → `"Invalid unit type"`
- Missing custom unit → `"Custom unit label is required"`
- Invalid color format → `"Invalid color format (use hex code)"`

### Example

```typescript
// Request
const result = await createBoard({
  name: "Morning Workout",
  emoji: "💪",
  color: "#3B82F6",
  unitType: "boolean"
});

// Response
{
  boardId: "b1234567890abcdef",
  board: {
    _id: "b1234567890abcdef",
    name: "Morning Workout",
    emoji: "💪",
    color: "#3B82F6",
    unitType: "boolean",
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    isArchived: false,
    // ... other fields
  }
}
```

### Implementation Notes

- Case-insensitive name uniqueness check per user
- Initializes streaks and counters to 0
- Default color if none provided: Generate from name hash
- Default emoji if none provided: "📊"

---

## update

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter      | Type           | Required | Description     | Validation         |
| -------------- | -------------- | -------- | --------------- | ------------------ |
| `boardId`      | `Id<"boards">` | Yes      | Board ID        | Valid board ID     |
| `name`         | `string`       | No       | New name        | 1-50 chars, unique |
| `description`  | `string`       | No       | New description | Max 500 chars      |
| `emoji`        | `string`       | No       | New emoji       | Single emoji       |
| `color`        | `string`       | No       | New color       | Valid hex          |
| `targetAmount` | `number`       | No       | New target      | Positive number    |

### Returns

| Field     | Type      | Description          |
| --------- | --------- | -------------------- |
| `success` | `boolean` | Always `true`        |
| `board`   | `Board`   | Updated board object |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Name already exists → `"A board with this name already exists"`

### Example

```typescript
// Request
const result = await updateBoard({
  boardId: "b1234567890abcdef",
  name: "Evening Workout",
  targetAmount: 45
});

// Response
{
  success: true,
  board: {
    _id: "b1234567890abcdef",
    name: "Evening Workout",
    targetAmount: 45,
    // ... other fields
  }
}
```

### Implementation Notes

- Partial updates (only provided fields are changed)
- Cannot change `unitType` or `unit` after creation (would invalidate historical data)
- Name uniqueness check excludes current board

---

## archive

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `success` | `boolean` | Always `true` |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Already archived → `"Board is already archived"`

### Example

```typescript
// Request
const result = await archiveBoard({ boardId: "b1234567890abcdef" });

// Response
{
  success: true;
}
```

### Implementation Notes

- Sets `isArchived = true` and `archivedAt = Date.now()`
- Does not delete data (reversible)
- Archived boards hidden from main dashboard
- Check-ins and stats preserved

---

## restore

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `success` | `boolean` | Always `true` |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Not archived → `"Board is not archived"`

### Example

```typescript
// Request
const result = await restoreBoard({ boardId: "b1234567890abcdef" });

// Response
{
  success: true;
}
```

### Implementation Notes

- Sets `isArchived = false`, clears `archivedAt`
- Board reappears on dashboard
- All historical data intact

---

## delete

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `success` | `boolean` | Always `true` |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const result = await deleteBoard({ boardId: "b1234567890abcdef" });

// Response
{
  success: true;
}
```

### Implementation Notes

- **IRREVERSIBLE** - requires confirmation dialog in UI
- Cascade deletes all check-ins for this board
- Deletes associated notification if exists
- Soft-deletes associated insights (marks as hidden)
- Shows warning: "All check-in data will be permanently deleted"
