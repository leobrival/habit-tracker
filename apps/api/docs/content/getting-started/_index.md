---
title: "Getting Started"
description: "Get started with the Checker API in 5 minutes"
weight: 1
---

# Getting Started

This guide will help you make your first API call to Checker in under 5 minutes.

## Prerequisites

- cURL or any HTTP client
- A valid email address

## Step 1: Create an Account

```bash
curl -X POST https://api.checker.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-secure-password",
    "name": "Your Name"
  }'
```

Save the API key from the response. It will look like: `chk_live_xxxxx`

## Step 2: Create Your First Board

```bash
curl -X POST https://api.checker.app/v1/boards \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Reading",
    "emoji": "📚",
    "color": "#10B981",
    "unitType": "time",
    "unit": "minutes",
    "targetAmount": 30
  }'
```

## Step 3: Record a Check-in

```bash
curl -X POST https://api.checker.app/v1/boards/BOARD_ID/check-ins \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 45,
    "note": "Finished chapter 3!"
  }'
```

## Step 4: Check Your Progress

```bash
curl https://api.checker.app/v1/boards/BOARD_ID/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Quick Actions for Raycast

Use the quick endpoints for faster integrations:

```bash
# Quick status of all boards
curl https://api.checker.app/v1/quick/status \
  -H "Authorization: Bearer YOUR_API_KEY"

# Quick check-in by board name
curl -X POST https://api.checker.app/v1/quick/check-in \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "boardName": "Daily Reading",
    "amount": 30
  }'
```

## Next Steps

- [Learn about authentication](/authentication/)
- [Explore the full API reference](/api-reference/)
- Build a Raycast extension using the Quick Actions API
