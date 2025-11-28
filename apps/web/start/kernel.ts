import router from "@adonisjs/core/services/router";
import server from "@adonisjs/core/services/server";

server.errorHandler(() => import("#exceptions/handler"));

server.use([
	() => import("@adonisjs/static/static_middleware"),
	() => import("@adonisjs/vite/vite_middleware"),
	() => import("@adonisjs/inertia/inertia_middleware"),
]);

router.use([
	() => import("@adonisjs/session/session_middleware"),
	() => import("@adonisjs/shield/shield_middleware"),
]);
