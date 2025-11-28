import type { HttpContext } from "@adonisjs/core/http";
import Board from "#models/board";

export default class UsersController {
	/**
	 * GET /v1/users/me
	 * Get current user profile
	 */
	async show({ auth, response }: HttpContext) {
		const user = auth.user!;

		return response.ok({
			data: {
				id: user.id,
				email: user.email,
				name: user.name,
				image: user.image,
				timezone: user.timezone,
				theme: user.theme,
				notificationSettings: user.notificationSettings,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		});
	}

	/**
	 * PUT /v1/users/me
	 * Update current user profile
	 */
	async update({ auth, request, response }: HttpContext) {
		const user = auth.user!;
		const data = request.only([
			"name",
			"timezone",
			"theme",
			"notificationSettings",
		]);

		if (data.name !== undefined) user.name = data.name;
		if (data.timezone !== undefined) user.timezone = data.timezone;
		if (data.theme !== undefined) user.theme = data.theme;
		if (data.notificationSettings !== undefined) {
			user.notificationSettings = data.notificationSettings;
		}

		await user.save();

		return response.ok({
			data: {
				id: user.id,
				email: user.email,
				name: user.name,
				timezone: user.timezone,
				theme: user.theme,
				notificationSettings: user.notificationSettings,
				updatedAt: user.updatedAt,
			},
		});
	}

	/**
	 * GET /v1/users/me/dashboard
	 * Get dashboard summary for current user
	 */
	async dashboard({ auth, response }: HttpContext) {
		const user = auth.user!;

		const boards = await Board.query()
			.where("userId", user.id)
			.where("isArchived", false)
			.orderBy("updatedAt", "desc");

		const totalBoards = boards.length;
		const totalCheckIns = boards.reduce((sum, b) => sum + b.totalCheckIns, 0);
		const totalCurrentStreak = boards.reduce(
			(sum, b) => sum + b.currentStreak,
			0,
		);
		const bestStreak = Math.max(...boards.map((b) => b.longestStreak), 0);

		return response.ok({
			data: {
				summary: {
					totalBoards,
					totalCheckIns,
					totalCurrentStreak,
					bestStreak,
				},
				boards: boards.slice(0, 5).map((b) => ({
					id: b.id,
					name: b.name,
					emoji: b.emoji,
					color: b.color,
					currentStreak: b.currentStreak,
					lastCheckInDate: b.lastCheckInDate,
				})),
			},
		});
	}
}
