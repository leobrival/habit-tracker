# Notification Contracts

This file defines notification/reminder management operations.

---

## get

**Type**: Query
**Auth Required**: Yes

### Arguments

| Parameter | Type           | Required | Description | Validation     |
| --------- | -------------- | -------- | ----------- | -------------- |
| `boardId` | `Id<"boards">` | Yes      | Board ID    | Valid board ID |

### Returns

| Field                       | Type                   | Description                        |
| --------------------------- | ---------------------- | ---------------------------------- |
| Notification object or null | `Notification \| null` | Reminder settings, or null if none |

**Notification Object**:

| Field           | Type                  | Description                 |
| --------------- | --------------------- | --------------------------- |
| `_id`           | `Id<"notifications">` | Notification ID             |
| `boardId`       | `Id<"boards">`        | Parent board ID             |
| `scheduledTime` | `string`              | Time of day (HH:mm)         |
| `enabled`       | `boolean`             | Whether active              |
| `lastSent`      | `number \| undefined` | Last notification timestamp |
| `timezone`      | `string`              | User's timezone             |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`

### Example

```typescript
// Request
const notification = useQuery(api.notifications.get, {
  boardId: "b1234567890abcdef"
});

// Response (if exists)
{
  _id: "n1234567890abcdef",
  boardId: "b1234567890abcdef",
  scheduledTime: "09:00",
  enabled: true,
  lastSent: 1699878400000,
  timezone: "America/New_York"
}

// Response (if no notification)
null
```

### Implementation Notes

- One notification per board (1:1 relationship)
- Used to display reminder toggle in board settings
- Real-time subscription updates when reminder is enabled/disabled

---

## enable

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter       | Type           | Required | Description         | Validation           |
| --------------- | -------------- | -------- | ------------------- | -------------------- |
| `boardId`       | `Id<"boards">` | Yes      | Board ID            | Valid board ID       |
| `scheduledTime` | `string`       | Yes      | Time of day (HH:mm) | Valid 24-hour format |

### Returns

| Field            | Type                  | Description                     |
| ---------------- | --------------------- | ------------------------------- |
| `notificationId` | `Id<"notifications">` | Created/updated notification ID |
| `success`        | `boolean`             | Always `true`                   |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- Invalid time format → `"Invalid time format (use HH:mm)"`
- Browser permission denied → `"Notification permission required"`

### Example

```typescript
// Request
const result = await enableNotification({
  boardId: "b1234567890abcdef",
  scheduledTime: "09:00"
});

// Response
{
  notificationId: "n1234567890abcdef",
  success: true
}
```

### Implementation Notes

- Creates notification if doesn't exist, updates if exists (upsert)
- Automatically copies user's current timezone
- Requires browser notification permission (prompt user in UI)
- Sets `enabled = true`
- Scheduled function checks this daily and sends push notifications

---

## disable

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
- No notification exists → `"Notification not found"`

### Example

```typescript
// Request
const result = await disableNotification({
  boardId: "b1234567890abcdef",
});

// Response
{
  success: true;
}
```

### Implementation Notes

- Sets `enabled = false`
- Does not delete notification record (preserves `scheduledTime` setting)
- User can re-enable later without re-entering time

---

## updateSchedule

**Type**: Mutation
**Auth Required**: Yes

### Arguments

| Parameter       | Type           | Required | Description      | Validation           |
| --------------- | -------------- | -------- | ---------------- | -------------------- |
| `boardId`       | `Id<"boards">` | Yes      | Board ID         | Valid board ID       |
| `scheduledTime` | `string`       | Yes      | New time (HH:mm) | Valid 24-hour format |

### Returns

| Field     | Type      | Description   |
| --------- | --------- | ------------- |
| `success` | `boolean` | Always `true` |

### Errors

- Not authenticated → `"Unauthenticated"`
- Board not found → `"Board not found"`
- Unauthorized → `"Unauthorized"`
- No notification exists → `"Notification not found"`
- Invalid time format → `"Invalid time format (use HH:mm)"`

### Example

```typescript
// Request
const result = await updateNotificationSchedule({
  boardId: "b1234567890abcdef",
  scheduledTime: "08:30",
});

// Response
{
  success: true;
}
```

### Implementation Notes

- Updates only the `scheduledTime` field
- Does not affect `enabled` status
- Takes effect the next day (notifications sent based on new schedule)

---

## sendDailyReminders

**Type**: Action (Scheduled)
**Auth Required**: No (internal scheduled job)

### Arguments

None (runs for all users)

### Returns

| Field                  | Type     | Description                        |
| ---------------------- | -------- | ---------------------------------- |
| `notificationsSent`    | `number` | Count of notifications sent        |
| `notificationsSkipped` | `number` | Count skipped (already checked in) |

### Errors

None (logs errors internally)

### Implementation Notes

- Runs every hour via Convex scheduled function
- For each enabled notification:
  1. Check if current time >= scheduledTime (in user's timezone)
  2. Check if user has already checked in today on that board
  3. Check if notification already sent today
  4. If all checks pass, send browser push notification
  5. Update `lastSent` timestamp
- Uses Web Push API for browser notifications
- Respects browser notification permission
- Gracefully handles errors (e.g., permission revoked, browser offline)

**Notification Content**:

```typescript
{
  title: "Time to check in: {boardName}",
  body: "Keep your {currentStreak}-day streak going!",
  icon: "/icon-192x192.png",
  badge: "/badge-72x72.png",
  tag: `checkin-${boardId}`,
  data: {
    boardId: boardId,
    url: `/boards/${boardId}`
  },
  actions: [
    { action: "checkin", title: "Check In Now" },
    { action: "dismiss", title: "Dismiss" }
  ]
}
```

**Clicking Notification**:

- Opens app to `/boards/${boardId}` page
- If "Check In Now" action clicked, auto-triggers check-in mutation

---

## getAllForUser

**Type**: Query
**Auth Required**: Yes

### Arguments

None

### Returns

| Field                         | Type             | Description              |
| ----------------------------- | ---------------- | ------------------------ |
| Array of Notification objects | `Notification[]` | All user's notifications |

### Errors

- Not authenticated → `"Unauthenticated"`

### Example

```typescript
// Request
const notifications = useQuery(api.notifications.getAllForUser);

// Response
[
  {
    _id: "n1234567890abcdef",
    boardId: "b1234567890abcdef",
    scheduledTime: "09:00",
    enabled: true,
    lastSent: 1699878400000,
    timezone: "America/New_York",
  },
  {
    _id: "n2234567890abcdef",
    boardId: "b2234567890abcdef",
    scheduledTime: "20:00",
    enabled: false,
    lastSent: 1699792000000,
    timezone: "America/New_York",
  },
];
```

### Implementation Notes

- Used in settings page to show all reminder configurations
- Allows bulk management of notifications
- Real-time subscription updates when reminders are enabled/disabled

---

## requestPermission

**Type**: Action (Client-side)
**Auth Required**: Yes

### Arguments

None

### Returns

| Field     | Type      | Description                |
| --------- | --------- | -------------------------- |
| `granted` | `boolean` | Whether permission granted |

### Errors

- Browser doesn't support notifications → `"Notifications not supported"`
- User denied permission → `"Notification permission denied"`

### Example

```typescript
// Request
const result = await requestNotificationPermission();

// Response
{
  granted: true;
}
```

### Implementation Notes

- Called when user first enables a notification
- Uses browser's `Notification.requestPermission()` API
- Shows browser's native permission prompt
- Returns permission state: "granted", "denied", or "default"
- If denied, show UI message explaining how to enable in browser settings
