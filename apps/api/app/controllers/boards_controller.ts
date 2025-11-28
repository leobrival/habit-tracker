import type { HttpContext } from "@adonisjs/core/http";
import { DateTime } from "luxon";
import Board from "#models/board";
import CheckIn from "#models/check_in";

export default class BoardsController {
	/**
	 * GET /v1/boards
	 * List all boards for authenticated user
	 */
	async index({ auth, request, response }: HttpContext) {
		const includeArchived = request.input("includeArchived", false);

		const query = Board.query().where("userId", auth.user!.id);

		if (!includeArchived) {
			query.where("isArchived", false);
		}

		const boards = await query.orderBy("updatedAt", "desc");

		return response.ok({
			data: boards.map((b) => ({
				id: b.id,
				name: b.name,
				description: b.description,
				emoji: b.emoji,
				color: b.color,
				unitType: b.unitType,
				unit: b.unit,
				targetAmount: b.targetAmount,
				currentStreak: b.currentStreak,
				longestStreak: b.longestStreak,
				totalCheckIns: b.totalCheckIns,
				isArchived: b.isArchived,
				lastCheckInDate: b.lastCheckInDate,
				createdAt: b.createdAt,
				updatedAt: b.updatedAt,
			})),
		});
	}

	/**
	 * POST /v1/boards
	 * Create a new board
	 */
	async store({ auth, request, response }: HttpContext) {
		const data = request.only([
			"name",
			"description",
			"emoji",
			"color",
			"unitType",
			"unit",
			"targetAmount",
		]);

		const board = await Board.create({
			...data,
			userId: auth.user!.id,
			currentStreak: 0,
			longestStreak: 0,
			totalCheckIns: 0,
			isArchived: false,
		});

		return response.created({
			data: {
				id: board.id,
				name: board.name,
				description: board.description,
				emoji: board.emoji,
				color: board.color,
				unitType: board.unitType,
				unit: board.unit,
				targetAmount: board.targetAmount,
				createdAt: board.createdAt,
			},
		});
	}

	/**
	 * GET /v1/boards/:id
	 * Get a specific board
	 */
	async show({ auth, params, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		return response.ok({
			data: {
				id: board.id,
				name: board.name,
				description: board.description,
				emoji: board.emoji,
				color: board.color,
				unitType: board.unitType,
				unit: board.unit,
				targetAmount: board.targetAmount,
				currentStreak: board.currentStreak,
				longestStreak: board.longestStreak,
				totalCheckIns: board.totalCheckIns,
				isArchived: board.isArchived,
				lastCheckInDate: board.lastCheckInDate,
				createdAt: board.createdAt,
				updatedAt: board.updatedAt,
			},
		});
	}

	/**
	 * PUT /v1/boards/:id
	 * Update a board
	 */
	async update({ auth, params, request, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		const data = request.only([
			"name",
			"description",
			"emoji",
			"color",
			"unitType",
			"unit",
			"targetAmount",
		]);

		board.merge(data);
		await board.save();

		return response.ok({ data: board });
	}

	/**
	 * DELETE /v1/boards/:id
	 * Delete a board
	 */
	async destroy({ auth, params, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		await board.delete();

		return response.ok({
			meta: { message: "Board deleted successfully." },
		});
	}

	/**
	 * POST /v1/boards/:id/archive
	 * Archive a board
	 */
	async archive({ auth, params, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		board.isArchived = true;
		board.archivedAt = DateTime.now();
		await board.save();

		return response.ok({ data: board });
	}

	/**
	 * POST /v1/boards/:id/restore
	 * Restore an archived board
	 */
	async restore({ auth, params, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		board.isArchived = false;
		board.archivedAt = null;
		await board.save();

		return response.ok({ data: board });
	}

	/**
	 * GET /v1/boards/:id/heatmap
	 * Get heatmap data for a board
	 */
	async heatmap({ auth, params, request, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		const year = request.input("year", DateTime.now().year);
		const startDate = DateTime.fromObject({
			year,
			month: 1,
			day: 1,
		}).toISODate();
		const endDate = DateTime.fromObject({
			year,
			month: 12,
			day: 31,
		}).toISODate();

		const checkIns = await CheckIn.query()
			.where("boardId", params.id)
			.where("date", ">=", startDate!)
			.where("date", "<=", endDate!)
			.orderBy("date", "asc");

		// Group by date
		const heatmapData = checkIns.reduce(
			(acc, ci) => {
				if (!acc[ci.date]) {
					acc[ci.date] = { count: 0, total: 0 };
				}
				acc[ci.date].count++;
				acc[ci.date].total += Number(ci.amount) || 1;
				return acc;
			},
			{} as Record<string, { count: number; total: number }>,
		);

		return response.ok({
			data: {
				year,
				targetAmount: board.targetAmount,
				days: Object.entries(heatmapData).map(([date, data]) => ({
					date,
					sessions: data.count,
					total: data.total,
					intensity: board.targetAmount
						? Math.min(data.total / Number(board.targetAmount), 1)
						: 1,
				})),
			},
		});
	}

	/**
	 * GET /v1/boards/:id/stats
	 * Get statistics for a board
	 */
	async stats({ auth, params, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		// Calculate completion rates
		const now = DateTime.now();
		const thirtyDaysAgo = now.minus({ days: 30 }).toISODate();

		const recentCheckIns = await CheckIn.query()
			.where("boardId", params.id)
			.where("date", ">=", thirtyDaysAgo!)
			.select("date")
			.distinct("date");

		const completionRate30d = (recentCheckIns.length / 30) * 100;

		return response.ok({
			data: {
				currentStreak: board.currentStreak,
				longestStreak: board.longestStreak,
				totalCheckIns: board.totalCheckIns,
				completionRate30d: Math.round(completionRate30d),
				lastCheckInDate: board.lastCheckInDate,
			},
		});
	}

	/**
	 * GET /v1/quick/status
	 * Quick status for all boards (for Raycast)
	 */
	async quickStatus({ auth, response }: HttpContext) {
		const today = DateTime.now().toISODate();

		const boards = await Board.query()
			.where("userId", auth.user!.id)
			.where("isArchived", false)
			.orderBy("updatedAt", "desc");

		const boardsWithStatus = await Promise.all(
			boards.map(async (b) => {
				const todayCheckIn = await CheckIn.query()
					.where("boardId", b.id)
					.where("date", today!)
					.first();

				return {
					id: b.id,
					name: b.name,
					emoji: b.emoji,
					checkedInToday: !!todayCheckIn,
					currentStreak: b.currentStreak,
				};
			}),
		);

		return response.ok({ data: boardsWithStatus });
	}
}
