import type { HttpContext } from "@adonisjs/core/http";

export default class DashboardController {
	async index({ inertia }: HttpContext) {
		return inertia.render("home", {
			title: "Dashboard",
		});
	}

	async boards({ inertia }: HttpContext) {
		return inertia.render("boards/index", {
			boards: [],
		});
	}

	async board({ inertia, params }: HttpContext) {
		return inertia.render("boards/show", {
			boardId: params.id,
		});
	}

	async settings({ inertia }: HttpContext) {
		return inertia.render("settings", {
			user: null,
		});
	}
}
