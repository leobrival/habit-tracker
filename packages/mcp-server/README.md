# habit-tracker-mcp

MCP (Model Context Protocol) server for the Habit Tracker API. This server enables Claude Code to interact with your habit tracking data.

## Installation

```bash
npm install -g habit-tracker-mcp
```

Or run directly with npx:

```bash
npx habit-tracker-mcp
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHECKER_API_URL` | Habit Tracker API URL | `http://localhost:3333` |
| `CHECKER_API_KEY` | Your API key | Required |

### Claude Code Configuration

Add to your `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "habit-tracker": {
      "command": "npx",
      "args": ["-y", "habit-tracker-mcp"],
      "env": {
        "CHECKER_API_URL": "http://localhost:3333",
        "CHECKER_API_KEY": "your-api-key"
      }
    }
  }
}
```

Or for project-level configuration, add to `.mcp/project.json` in your project root.

## Available Tools

### Board Management

- `checker_list_boards` - List all habit boards
- `checker_create_board` - Create a new board
- `checker_get_board` - Get board details
- `checker_update_board` - Update a board
- `checker_delete_board` - Delete a board

### Check-ins

- `checker_quick_checkin` - Quick check-in to a habit
- `checker_quick_status` - Get today's status
- `checker_list_checkins` - List check-ins for a board
- `checker_create_checkin` - Create a check-in

### Statistics

- `checker_get_stats` - Get board statistics
- `checker_get_heatmap` - Get heatmap data
- `checker_get_profile` - Get user profile

## Usage Examples

Once configured, you can use natural language in Claude Code:

- "Show me my habit boards"
- "Create a new habit board for meditation"
- "Check in to my exercise habit"
- "What's my progress today?"
- "Show me stats for my reading habit"

## Getting an API Key

1. Register at the Habit Tracker API
2. Create an API key from your account settings
3. Add the key to your MCP configuration

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development
pnpm dev
```

## License

MIT
