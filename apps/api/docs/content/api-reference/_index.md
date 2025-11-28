---
title: "API Reference"
description: "Complete API reference for the Checker API"
weight: 3
---

# API Reference

## Boards

### List Boards

```http
GET /v1/boards
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| includeArchived | boolean | Include archived boards (default: false) |

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Morning Workout",
      "description": "Daily exercise routine",
      "emoji": "🏋️",
      "color": "#3B82F6",
      "unitType": "boolean",
      "unit": null,
      "targetAmount": null,
      "currentStreak": 7,
      "longestStreak": 21,
      "totalCheckIns": 45,
      "isArchived": false,
      "lastCheckInDate": "2024-01-15",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Board

```http
POST /v1/boards
```

Request body:

```json
{
  "name": "Morning Workout",
  "description": "Daily exercise routine",
  "emoji": "🏋️",
  "color": "#3B82F6",
  "unitType": "boolean",
  "unit": null,
  "targetAmount": null
}
```

Unit types: `boolean`, `time`, `distance`, `volume`, `mass`, `calories`, `money`, `percentage`, `custom`

### Get Board

```http
GET /v1/boards/{id}
```

### Update Board

```http
PUT /v1/boards/{id}
```

### Delete Board

```http
DELETE /v1/boards/{id}
```

### Archive Board

```http
POST /v1/boards/{id}/archive
```

### Restore Board

```http
POST /v1/boards/{id}/restore
```

### Get Heatmap Data

```http
GET /v1/boards/{id}/heatmap?year=2024
```

Response:

```json
{
  "data": {
    "year": 2024,
    "targetAmount": 30,
    "days": [
      {
        "date": "2024-01-15",
        "sessions": 2,
        "total": 45,
        "intensity": 1.0
      }
    ]
  }
}
```

### Get Board Stats

```http
GET /v1/boards/{id}/stats
```

Response:

```json
{
  "data": {
    "currentStreak": 7,
    "longestStreak": 21,
    "totalCheckIns": 45,
    "completionRate30d": 85,
    "lastCheckInDate": "2024-01-15"
  }
}
```

## Check-ins

### List Check-ins

```http
GET /v1/boards/{boardId}/check-ins
```

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter from date (YYYY-MM-DD) |
| endDate | string | Filter to date (YYYY-MM-DD) |
| limit | number | Max results to return |

### Create Check-in

```http
POST /v1/boards/{boardId}/check-ins
```

Request body:

```json
{
  "date": "2024-01-15",
  "amount": 30,
  "note": "Great workout session!"
}
```

- `date` is optional (defaults to today)
- `amount` is optional for boolean boards
- Cannot create check-ins for future dates

### Get Check-in

```http
GET /v1/check-ins/{id}
```

### Update Check-in

```http
PUT /v1/check-ins/{id}
```

### Delete Check-in

```http
DELETE /v1/check-ins/{id}
```

## Quick Actions

Optimized endpoints for Raycast and CLI tools.

### Quick Check-in

```http
POST /v1/quick/check-in
```

Request body:

```json
{
  "boardId": "uuid",
  "amount": 30,
  "note": "Quick check-in from Raycast"
}
```

Or by board name:

```json
{
  "boardName": "Morning Workout",
  "amount": 30
}
```

### Quick Status

```http
GET /v1/quick/status
```

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Morning Workout",
      "emoji": "🏋️",
      "checkedInToday": true,
      "currentStreak": 7
    }
  ]
}
```

## Users

### Get Current User

```http
GET /v1/users/me
```

### Update User

```http
PUT /v1/users/me
```

Request body:

```json
{
  "name": "New Name",
  "timezone": "America/New_York",
  "theme": "dark"
}
```

### Get Dashboard

```http
GET /v1/users/me/dashboard
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Common error codes:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_API_KEY | 401 | No API key provided |
| INVALID_API_KEY | 401 | API key is invalid or revoked |
| EXPIRED_API_KEY | 401 | API key has expired |
| INSUFFICIENT_SCOPE | 403 | API key lacks required scope |
| NOT_FOUND | 404 | Resource not found |
| FUTURE_DATE | 400 | Cannot create check-in for future date |
