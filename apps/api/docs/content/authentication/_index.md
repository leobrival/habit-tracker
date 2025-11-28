---
title: "Authentication"
description: "How to authenticate with the Checker API"
weight: 2
---

# Authentication

The Checker API uses API keys for authentication. Every request must include a valid API key.

## Getting an API Key

### 1. Create an Account

```bash
curl -X POST https://api.checker.app/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "your-secure-password",
    "name": "Your Name",
    "timezone": "Europe/Paris"
  }'
```

Response:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "your@email.com",
      "name": "Your Name"
    },
    "apiKey": {
      "id": "uuid",
      "name": "Default Key",
      "key": "chk_live_xxxxxxxxxxxxx",
      "keyPrefix": "chk_live_xxxxxx",
      "scopes": ["read", "write"]
    }
  },
  "meta": {
    "message": "Account created successfully. Store your API key securely - it won't be shown again."
  }
}
```

### 2. Create Additional Keys

```bash
curl -X POST https://api.checker.app/v1/api-keys \
  -H "Authorization: Bearer chk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raycast Extension",
    "scopes": ["read", "write"],
    "expiresInDays": 365
  }'
```

## Using Your API Key

Include your API key in every request using one of these methods:

### Authorization Header (Recommended)

```bash
curl https://api.checker.app/v1/boards \
  -H "Authorization: Bearer chk_live_xxxxx"
```

### X-API-Key Header

```bash
curl https://api.checker.app/v1/boards \
  -H "X-API-Key: chk_live_xxxxx"
```

## API Key Format

API keys follow this format:

```
chk_{environment}_{random_string}
```

- `chk`: Prefix identifying Checker API keys
- `environment`: `live` for production, `test` for sandbox
- `random_string`: 43 characters of cryptographically secure random data

Example: `chk_live_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0`

## Scopes

API keys can have different permission scopes:

| Scope | Description |
|-------|-------------|
| `read` | Read boards, check-ins, and statistics |
| `write` | Create and update boards and check-ins |
| `delete` | Delete boards and check-ins |
| `admin` | Full access including API key management |

## Revoking Keys

```bash
curl -X DELETE https://api.checker.app/v1/api-keys/{key_id} \
  -H "Authorization: Bearer chk_live_xxxxx"
```

## Security Best Practices

1. **Never share API keys** - Treat them like passwords
2. **Use environment variables** - Don't hardcode keys in source code
3. **Rotate keys regularly** - Create new keys and revoke old ones
4. **Use minimal scopes** - Only request the permissions you need
5. **Monitor usage** - Check last_used_at to detect unauthorized access
