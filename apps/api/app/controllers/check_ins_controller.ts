import type { HttpContext } from "@adonisjs/core/http";
import { DateTime } from "luxon";
import Board from "#models/board";
import CheckIn from "#models/check_in";

export default class CheckInsController {
	/**
	 * GET /v1/boards/:boardId/check-ins
	 * List check-ins for a board
	 */
	async index({ auth, params, request, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.boardId)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		const { startDate, endDate, limit } = request.only([
			"startDate",
			"endDate",
			"limit",
		]);

		const query = CheckIn.query()
			.where("boardId", params.boardId)
			.orderBy("date", "desc");

		if (startDate) query.where("date", ">=", startDate);
		if (endDate) query.where("date", "<=", endDate);
		if (limit) query.limit(Number(limit));

		const checkIns = await query;

		return response.ok({
			data: checkIns.map((ci) => ({
				id: ci.id,
				date: ci.date,
				timestamp: ci.timestamp,
				amount: ci.amount,
				note: ci.note,
				sessionNumber: ci.sessionNumber,
				createdAt: ci.createdAt,
			})),
		});
	}

	/**
	 * POST /v1/boards/:boardId/check-ins
	 * Create a check-in
	 */
	async store({ auth, params, request, response }: HttpContext) {
		const board = await Board.query()
			.where("id", params.boardId)
			.where("userId", auth.user!.id)
			.first();

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		const { date, amount, note } = request.only(["date", "amount", "note"]);
		const checkInDate = date || DateTime.now().toISODate();

		// Check for future date
		if (checkInDate > DateTime.now().toISODate()!) {
			return response.badRequest({
				error: {
					code: "FUTURE_DATE",
					message: "Cannot check in for future dates.",
				},
			});
		}

		// Get session number
		const existingCheckIns = await CheckIn.query()
			.where("boardId", board.id)
			.where("date", checkInDate);

		const sessionNumber = existingCheckIns.length + 1;

		const checkIn = await CheckIn.create({
			boardId: board.id,
			userId: auth.user!.id,
			date: checkInDate,
			timestamp: DateTime.now(),
			amount: amount ?? null,
			note: note ?? null,
			sessionNumber,
		});

		// Update board stats
		await this.updateBoardStats(board, checkInDate);

		return response.created({
			data: {
				id: checkIn.id,
				date: checkIn.date,
				timestamp: checkIn.timestamp,
				amount: checkIn.amount,
				note: checkIn.note,
				sessionNumber: checkIn.sessionNumber,
			},
		});
	}

	/**
	 * GET /v1/check-ins/:id
	 * Get a specific check-in
	 */
	async show({ auth, params, response }: HttpContext) {
		const checkIn = await CheckIn.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!checkIn) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Check-in not found." },
			});
		}

		return response.ok({
			data: {
				id: checkIn.id,
				boardId: checkIn.boardId,
				date: checkIn.date,
				timestamp: checkIn.timestamp,
				amount: checkIn.amount,
				note: checkIn.note,
				sessionNumber: checkIn.sessionNumber,
				createdAt: checkIn.createdAt,
			},
		});
	}

	/**
	 * PUT /v1/check-ins/:id
	 * Update a check-in
	 */
	async update({ auth, params, request, response }: HttpContext) {
		const checkIn = await CheckIn.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.first();

		if (!checkIn) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Check-in not found." },
			});
		}

		const { amount, note } = request.only(["amount", "note"]);

		if (amount !== undefined) checkIn.amount = amount;
		if (note !== undefined) checkIn.note = note;

		await checkIn.save();

		return response.ok({
			data: {
				id: checkIn.id,
				date: checkIn.date,
				amount: checkIn.amount,
				note: checkIn.note,
			},
		});
	}

	/**
	 * DELETE /v1/check-ins/:id
	 * Delete a check-in
	 */
	async destroy({ auth, params, response }: HttpContext) {
		const checkIn = await CheckIn.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.preload("board")
			.first();

		if (!checkIn) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Check-in not found." },
			});
		}

		const board = checkIn.board;
		const checkInDate = checkIn.date;

		await checkIn.delete();

		// Update board stats after deletion
		await this.updateBoardStats(board, checkInDate);

		return response.ok({
			meta: { message: "Check-in deleted successfully." },
		});
	}

	/**
	 * POST /v1/quick/check-in
	 * Quick check-in by board ID or name (for Raycast)
	 */
	async quickCheckIn({ auth, request, response }: HttpContext) {
		const { boardId, boardName, amount, note } = request.only([
			"boardId",
			"boardName",
			"amount",
			"note",
		]);

		let board: Board | null = null;

		if (boardId) {
			board = await Board.query()
				.where("id", boardId)
				.where("userId", auth.user!.id)
				.where("isArchived", false)
				.first();
		} else if (boardName) {
			board = await Board.query()
				.where("name", boardName)
				.where("userId", auth.user!.id)
				.where("isArchived", false)
				.first();
		}

		if (!board) {
			return response.notFound({
				error: { code: "NOT_FOUND", message: "Board not found." },
			});
		}

		const today = DateTime.now().toISODate()!;

		// Get session number
		const existingCheckIns = await CheckIn.query()
			.where("boardId", board.id)
			.where("date", today);

		const sessionNumber = existingCheckIns.length + 1;

		const checkIn = await CheckIn.create({
			boardId: board.id,
			userId: auth.user!.id,
			date: today,
			timestamp: DateTime.now(),
			amount: amount ?? null,
			note: note ?? null,
			sessionNumber,
		});

		// Update board stats
		await this.updateBoardStats(board, today);

		return response.created({
			data: {
				checkIn: {
					id: checkIn.id,
					sessionNumber: checkIn.sessionNumber,
				},
				board: {
					id: board.id,
					name: board.name,
					emoji: board.emoji,
					currentStreak: board.currentStreak,
				},
			},
		});
	}

	/**
	 * Update board statistics after check-in change
	 */
	private async updateBoardStats(
		board: Board,
		_checkInDate: string,
	): Promise<void> {
		// Update total check-ins
		const totalCheckIns = await CheckIn.query()
			.where("boardId", board.id)
			.count("* as total");
		board.totalCheckIns = Number(totalCheckIns[0].$extras.total);

		// Update last check-in date
		const lastCheckIn = await CheckIn.query()
			.where("boardId", board.id)
			.orderBy("date", "desc")
			.first();
		board.lastCheckInDate = lastCheckIn?.date || null;

		// Calculate current streak
		const currentStreak = await this.calculateStreak(board.id);
		board.currentStreak = currentStreak;

		// Update longest streak if needed
		if (currentStreak > board.longestStreak) {
			board.longestStreak = currentStreak;
		}

		await board.save();
	}

	/**
	 * Calculate current streak for a board
	 */
	private async calculateStreak(boardId: string): Promise<number> {
		const checkIns = await CheckIn.query()
			.where("boardId", boardId)
			.select("date")
			.distinct("date")
			.orderBy("date", "desc");

		if (checkIns.length === 0) return 0;

		let streak = 0;
		let currentDate = DateTime.now().startOf("day");

		// Check if there's a check-in today or yesterday
		const firstCheckInDate = DateTime.fromISO(checkIns[0].date);
		const daysDiff = currentDate.diff(firstCheckInDate, "days").days;

		// If no check-in today or yesterday, streak is 0
		if (daysDiff > 1) return 0;

		// Start from today or yesterday depending on last check-in
		if (daysDiff === 1) {
			currentDate = currentDate.minus({ days: 1 });
		}

		const dateSet = new Set(checkIns.map((ci) => ci.date));

		while (dateSet.has(currentDate.toISODate()!)) {
			streak++;
			currentDate = currentDate.minus({ days: 1 });
		}

		return streak;
	}
}
