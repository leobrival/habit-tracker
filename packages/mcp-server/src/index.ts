#!/usr/bin/env node
/**
 * MCP Server for Checker Habit Tracker API.
 *
 * This server provides tools to interact with the Checker API for habit tracking,
 * including board management, check-ins, and statistics.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Constants
const API_URL = process.env.CHECKER_API_URL || "http://localhost:3333";
const API_KEY = process.env.CHECKER_API_KEY || "";
const CHARACTER_LIMIT = 25000;

// Types
interface Board {
	id: string;
	name: string;
	description: string | null;
	emoji: string;
	color: string;
	unitType: string;
	unit: string | null;
	targetAmount: number | null;
	currentStreak: number;
	longestStreak: number;
	totalCheckIns: number;
	isArchived: boolean;
	lastCheckInDate: string | null;
}

interface CheckIn {
	id: string;
	boardId: string;
	date: string;
	amount: number;
	note: string | null;
}

interface QuickStatus {
	boards: Array<{
		id: string;
		name: string;
		emoji: string;
		checkedInToday: boolean;
		currentStreak: number;
	}>;
}

// API Client
async function makeApiRequest<T>(
	endpoint: string,
	method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
	body?: unknown,
): Promise<T> {
	const url = `${API_URL}${endpoint}`;

	const response = await fetch(url, {
		method,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${API_KEY}`,
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`API Error (${response.status}): ${error}`);
	}

	return response.json() as Promise<T>;
}

function handleApiError(error: unknown): string {
	if (error instanceof Error) {
		if (error.message.includes("404")) {
			return "Error: Resource not found. Please check the ID is correct.";
		}
		if (error.message.includes("403")) {
			return "Error: Permission denied. Check your API key has the required scopes.";
		}
		if (error.message.includes("401")) {
			return "Error: Authentication failed. Please check your API key.";
		}
		if (error.message.includes("429")) {
			return "Error: Rate limit exceeded. Please wait before making more requests.";
		}
		return `Error: ${error.message}`;
	}
	return `Error: Unexpected error occurred: ${String(error)}`;
}

// Zod Schemas
const ListBoardsSchema = z
	.object({
		include_archived: z
			.boolean()
			.default(false)
			.describe("Include archived boards in the results"),
	})
	.strict();

const CreateBoardSchema = z
	.object({
		name: z.string().min(1).max(100).describe("Name of the habit board"),
		description: z
			.string()
			.max(500)
			.optional()
			.describe("Description of the habit"),
		emoji: z.string().default("✅").describe("Emoji icon for the board"),
		color: z
			.string()
			.default("#10B981")
			.describe("Color hex code for the board"),
		unit_type: z
			.enum(["boolean", "quantity", "duration"])
			.default("boolean")
			.describe(
				"Type of tracking: boolean (done/not done), quantity, or duration",
			),
		unit: z
			.string()
			.optional()
			.describe("Unit label for quantity/duration (e.g., 'pages', 'minutes')"),
		target_amount: z
			.number()
			.positive()
			.optional()
			.describe("Target amount per check-in"),
	})
	.strict();

const GetBoardSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board"),
	})
	.strict();

const UpdateBoardSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board to update"),
		name: z.string().min(1).max(100).optional().describe("New name"),
		description: z.string().max(500).optional().describe("New description"),
		emoji: z.string().optional().describe("New emoji"),
		color: z.string().optional().describe("New color"),
		target_amount: z
			.number()
			.positive()
			.optional()
			.describe("New target amount"),
	})
	.strict();

const DeleteBoardSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board to delete"),
	})
	.strict();

const QuickCheckInSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board to check in to"),
		amount: z
			.number()
			.positive()
			.default(1)
			.describe("Amount for the check-in (default: 1)"),
	})
	.strict();

const ListCheckInsSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board"),
		limit: z
			.number()
			.int()
			.min(1)
			.max(100)
			.default(20)
			.describe("Maximum results to return"),
		offset: z
			.number()
			.int()
			.min(0)
			.default(0)
			.describe("Number of results to skip"),
	})
	.strict();

const CreateCheckInSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board"),
		date: z
			.string()
			.optional()
			.describe("Date for the check-in (YYYY-MM-DD, defaults to today)"),
		amount: z
			.number()
			.positive()
			.default(1)
			.describe("Amount for the check-in"),
		note: z
			.string()
			.max(500)
			.optional()
			.describe("Optional note for the check-in"),
	})
	.strict();

const GetBoardStatsSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board"),
	})
	.strict();

const GetBoardHeatmapSchema = z
	.object({
		board_id: z.string().uuid().describe("UUID of the board"),
		days: z
			.number()
			.int()
			.min(7)
			.max(365)
			.default(90)
			.describe("Number of days for heatmap data"),
	})
	.strict();

// Create MCP Server
const server = new McpServer({
	name: "checker-mcp-server",
	version: "0.1.0",
});

// Register Tools

// List Boards
server.registerTool(
	"checker_list_boards",
	{
		title: "List Habit Boards",
		description: `List all habit boards for the authenticated user.

Returns an array of boards with their current streak, total check-ins, and other metadata.

Args:
  - include_archived (boolean): Include archived boards (default: false)

Returns:
  Array of board objects with id, name, emoji, currentStreak, longestStreak, totalCheckIns`,
		inputSchema: ListBoardsSchema,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const boards = await makeApiRequest<Board[]>("/v1/boards");
			const filtered = params.include_archived
				? boards
				: boards.filter((b) => !b.isArchived);

			const text = filtered
				.map(
					(b) =>
						`${b.emoji} **${b.name}** (${b.id})\n  Streak: ${b.currentStreak} days | Total: ${b.totalCheckIns} check-ins`,
				)
				.join("\n\n");

			return {
				content: [{ type: "text", text: text || "No boards found." }],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Create Board
server.registerTool(
	"checker_create_board",
	{
		title: "Create Habit Board",
		description: `Create a new habit board for tracking a habit.

Args:
  - name (string): Name of the habit (required)
  - description (string): Description (optional)
  - emoji (string): Emoji icon (default: ✅)
  - color (string): Color hex code (default: #10B981)
  - unit_type (string): 'boolean', 'quantity', or 'duration' (default: boolean)
  - unit (string): Unit label for quantity/duration
  - target_amount (number): Target per check-in

Returns:
  The created board object with its ID`,
		inputSchema: CreateBoardSchema,
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: false,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const board = await makeApiRequest<Board>("/v1/boards", "POST", {
				name: params.name,
				description: params.description,
				emoji: params.emoji,
				color: params.color,
				unitType: params.unit_type,
				unit: params.unit,
				targetAmount: params.target_amount,
			});

			return {
				content: [
					{
						type: "text",
						text: `Created board: ${board.emoji} **${board.name}** (${board.id})`,
					},
				],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Get Board
server.registerTool(
	"checker_get_board",
	{
		title: "Get Board Details",
		description: `Get detailed information about a specific habit board.

Args:
  - board_id (string): UUID of the board

Returns:
  Board details including streak, statistics, and configuration`,
		inputSchema: GetBoardSchema,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const board = await makeApiRequest<Board>(
				`/v1/boards/${params.board_id}`,
			);

			const text = `# ${board.emoji} ${board.name}

**ID**: ${board.id}
**Description**: ${board.description || "No description"}
**Type**: ${board.unitType}${board.unit ? ` (${board.unit})` : ""}
**Target**: ${board.targetAmount || "None set"}

## Statistics
- **Current Streak**: ${board.currentStreak} days
- **Longest Streak**: ${board.longestStreak} days
- **Total Check-ins**: ${board.totalCheckIns}
- **Last Check-in**: ${board.lastCheckInDate || "Never"}`;

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Update Board
server.registerTool(
	"checker_update_board",
	{
		title: "Update Habit Board",
		description: `Update an existing habit board.

Args:
  - board_id (string): UUID of the board to update (required)
  - name (string): New name (optional)
  - description (string): New description (optional)
  - emoji (string): New emoji (optional)
  - color (string): New color (optional)
  - target_amount (number): New target amount (optional)

Returns:
  The updated board object`,
		inputSchema: UpdateBoardSchema,
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const { board_id, ...updates } = params;
			const board = await makeApiRequest<Board>(
				`/v1/boards/${board_id}`,
				"PUT",
				{
					name: updates.name,
					description: updates.description,
					emoji: updates.emoji,
					color: updates.color,
					targetAmount: updates.target_amount,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Updated board: ${board.emoji} **${board.name}** (${board.id})`,
					},
				],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Delete Board
server.registerTool(
	"checker_delete_board",
	{
		title: "Delete Habit Board",
		description: `Delete a habit board permanently.

Args:
  - board_id (string): UUID of the board to delete

Returns:
  Confirmation of deletion`,
		inputSchema: DeleteBoardSchema,
		annotations: {
			readOnlyHint: false,
			destructiveHint: true,
			idempotentHint: false,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			await makeApiRequest(`/v1/boards/${params.board_id}`, "DELETE");
			return {
				content: [{ type: "text", text: `Deleted board: ${params.board_id}` }],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Quick Check-in
server.registerTool(
	"checker_quick_checkin",
	{
		title: "Quick Check-in",
		description: `Quickly check in to a habit board for today.

This is the fastest way to record a habit completion. Use this for daily habit tracking.

Args:
  - board_id (string): UUID of the board (required)
  - amount (number): Amount for the check-in (default: 1)

Returns:
  Confirmation with updated streak information`,
		inputSchema: QuickCheckInSchema,
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: false,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const checkin = await makeApiRequest<CheckIn>(
				"/v1/quick/check-in",
				"POST",
				{
					boardId: params.board_id,
					amount: params.amount,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Checked in! Date: ${checkin.date}, Amount: ${checkin.amount}`,
					},
				],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Get Quick Status
server.registerTool(
	"checker_quick_status",
	{
		title: "Today's Status",
		description: `Get today's habit status for all boards.

Shows which habits have been completed today and their current streaks.

Returns:
  List of all boards with their today's completion status and current streak`,
		inputSchema: z.object({}).strict(),
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async () => {
		try {
			const status = await makeApiRequest<QuickStatus>("/v1/quick/status");

			const completed = status.boards.filter((b) => b.checkedInToday);
			const pending = status.boards.filter((b) => !b.checkedInToday);

			let text = `# Today's Status\n\n`;
			text += `**Progress**: ${completed.length}/${status.boards.length} habits completed\n\n`;

			if (completed.length > 0) {
				text += `## Completed\n`;
				for (const b of completed) {
					text += `- ${b.emoji} ${b.name} (${b.currentStreak} day streak)\n`;
				}
				text += "\n";
			}

			if (pending.length > 0) {
				text += `## Pending\n`;
				for (const b of pending) {
					text += `- ${b.emoji} ${b.name} (${b.currentStreak} day streak)\n`;
				}
			}

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// List Check-ins
server.registerTool(
	"checker_list_checkins",
	{
		title: "List Check-ins",
		description: `List check-ins for a specific board.

Args:
  - board_id (string): UUID of the board (required)
  - limit (number): Maximum results (default: 20, max: 100)
  - offset (number): Skip results for pagination (default: 0)

Returns:
  List of check-ins with date, amount, and notes`,
		inputSchema: ListCheckInsSchema,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const checkins = await makeApiRequest<CheckIn[]>(
				`/v1/boards/${params.board_id}/check-ins?limit=${params.limit}&offset=${params.offset}`,
			);

			if (checkins.length === 0) {
				return { content: [{ type: "text", text: "No check-ins found." }] };
			}

			const text = checkins
				.map(
					(c) => `- **${c.date}**: ${c.amount}${c.note ? ` - ${c.note}` : ""}`,
				)
				.join("\n");

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Create Check-in
server.registerTool(
	"checker_create_checkin",
	{
		title: "Create Check-in",
		description: `Create a check-in for a specific date.

Use this to backfill missed check-ins or record habits for specific dates.

Args:
  - board_id (string): UUID of the board (required)
  - date (string): Date in YYYY-MM-DD format (defaults to today)
  - amount (number): Amount for the check-in (default: 1)
  - note (string): Optional note

Returns:
  The created check-in object`,
		inputSchema: CreateCheckInSchema,
		annotations: {
			readOnlyHint: false,
			destructiveHint: false,
			idempotentHint: false,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const checkin = await makeApiRequest<CheckIn>(
				`/v1/boards/${params.board_id}/check-ins`,
				"POST",
				{
					date: params.date,
					amount: params.amount,
					note: params.note,
				},
			);

			return {
				content: [
					{
						type: "text",
						text: `Created check-in for ${checkin.date}: Amount ${checkin.amount}`,
					},
				],
			};
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Get Board Stats
server.registerTool(
	"checker_get_stats",
	{
		title: "Get Board Statistics",
		description: `Get detailed statistics for a habit board.

Args:
  - board_id (string): UUID of the board

Returns:
  Statistics including streak, completion rate, and averages`,
		inputSchema: GetBoardStatsSchema,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const stats = await makeApiRequest<{
				currentStreak: number;
				longestStreak: number;
				totalCheckIns: number;
				completionRate: number;
				averagePerDay: number;
			}>(`/v1/boards/${params.board_id}/stats`);

			const text = `# Board Statistics

- **Current Streak**: ${stats.currentStreak} days
- **Longest Streak**: ${stats.longestStreak} days
- **Total Check-ins**: ${stats.totalCheckIns}
- **Completion Rate**: ${(stats.completionRate * 100).toFixed(1)}%
- **Average per Day**: ${stats.averagePerDay.toFixed(2)}`;

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Get Board Heatmap
server.registerTool(
	"checker_get_heatmap",
	{
		title: "Get Board Heatmap",
		description: `Get heatmap data for visualizing habit consistency.

Args:
  - board_id (string): UUID of the board
  - days (number): Number of days (default: 90, max: 365)

Returns:
  Array of date/count pairs for heatmap visualization`,
		inputSchema: GetBoardHeatmapSchema,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async (params) => {
		try {
			const heatmap = await makeApiRequest<
				Array<{ date: string; count: number; level: number }>
			>(`/v1/boards/${params.board_id}/heatmap?days=${params.days}`);

			let text = JSON.stringify(heatmap, null, 2);
			if (text.length > CHARACTER_LIMIT) {
				text = `Heatmap data truncated. Showing first ${Math.floor(CHARACTER_LIMIT / 50)} entries.\n\n${text.slice(0, CHARACTER_LIMIT)}`;
			}

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Get User Profile
server.registerTool(
	"checker_get_profile",
	{
		title: "Get User Profile",
		description: `Get the current user's profile information.

Returns:
  User profile with email, name, timezone, and preferences`,
		inputSchema: z.object({}).strict(),
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: true,
		},
	},
	async () => {
		try {
			const user = await makeApiRequest<{
				id: string;
				email: string;
				name: string | null;
				timezone: string;
				theme: string;
			}>("/v1/users/me");

			const text = `# User Profile

- **ID**: ${user.id}
- **Email**: ${user.email}
- **Name**: ${user.name || "Not set"}
- **Timezone**: ${user.timezone}
- **Theme**: ${user.theme}`;

			return { content: [{ type: "text", text }] };
		} catch (error) {
			return { content: [{ type: "text", text: handleApiError(error) }] };
		}
	},
);

// Main function
async function main() {
	if (!API_KEY) {
		console.error(
			"WARNING: CHECKER_API_KEY environment variable not set. API calls will fail.",
		);
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error(`Checker MCP server running (API: ${API_URL})`);
}

main().catch((error) => {
	console.error("Server error:", error);
	process.exit(1);
});
