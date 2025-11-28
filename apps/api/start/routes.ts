/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from "@adonisjs/core/services/router";

const AuthController = () => import("#controllers/auth_controller");
const ApiKeysController = () => import("#controllers/api_keys_controller");
const BoardsController = () => import("#controllers/boards_controller");
const CheckInsController = () => import("#controllers/check_ins_controller");
const UsersController = () => import("#controllers/users_controller");

// Health check
router.get("/health", async () => {
	return {
		status: "healthy",
		timestamp: new Date().toISOString(),
	};
});

// API v1 routes
router
	.group(() => {
		// Public routes (no auth required)
		router.post("/auth/register", [AuthController, "register"]);
		router.post("/auth/login", [AuthController, "login"]);

		// Protected routes (API key required)
		router
			.group(() => {
				// User profile
				router.get("/users/me", [UsersController, "show"]);
				router.put("/users/me", [UsersController, "update"]);
				router.get("/users/me/dashboard", [UsersController, "dashboard"]);

				// API Keys management
				router.get("/api-keys", [ApiKeysController, "index"]);
				router.post("/api-keys", [ApiKeysController, "store"]);
				router.delete("/api-keys/:id", [ApiKeysController, "destroy"]);

				// Boards
				router.get("/boards", [BoardsController, "index"]);
				router.post("/boards", [BoardsController, "store"]);
				router.get("/boards/:id", [BoardsController, "show"]);
				router.put("/boards/:id", [BoardsController, "update"]);
				router.delete("/boards/:id", [BoardsController, "destroy"]);
				router.post("/boards/:id/archive", [BoardsController, "archive"]);
				router.post("/boards/:id/restore", [BoardsController, "restore"]);
				router.get("/boards/:id/heatmap", [BoardsController, "heatmap"]);
				router.get("/boards/:id/stats", [BoardsController, "stats"]);

				// Check-ins
				router.get("/boards/:boardId/check-ins", [CheckInsController, "index"]);
				router.post("/boards/:boardId/check-ins", [
					CheckInsController,
					"store",
				]);
				router.get("/check-ins/:id", [CheckInsController, "show"]);
				router.put("/check-ins/:id", [CheckInsController, "update"]);
				router.delete("/check-ins/:id", [CheckInsController, "destroy"]);

				// Quick actions
				router.post("/quick/check-in", [CheckInsController, "quickCheckIn"]);
				router.get("/quick/status", [BoardsController, "quickStatus"]);
			})
			.use(async (ctx, next) => {
				const { default: ApiKeyAuthMiddleware } = await import(
					"#middleware/api_key_auth_middleware"
				);
				const middleware = new ApiKeyAuthMiddleware();
				return middleware.handle(ctx, next, { scopes: ["read"] });
			});
	})
	.prefix("/v1");
