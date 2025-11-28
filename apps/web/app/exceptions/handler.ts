import { ExceptionHandler, type HttpContext } from "@adonisjs/core/http";
import type {
	StatusPageRange,
	StatusPageRenderer,
} from "@adonisjs/http-server/types";

export default class HttpExceptionHandler extends ExceptionHandler {
	protected debug = false;
	protected renderStatusPages = true;

	protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
		"404": (error, { inertia }: HttpContext) => {
			return inertia.render("errors/not_found", { error });
		},
		"500..599": (error, { inertia }: HttpContext) => {
			return inertia.render("errors/server_error", { error });
		},
	};
}
