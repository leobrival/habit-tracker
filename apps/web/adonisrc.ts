import { defineConfig } from "@adonisjs/core/app";

export default defineConfig({
	commands: [
		() => import("@adonisjs/core/commands"),
		() => import("@adonisjs/inertia/commands"),
		() => import("@adonisjs/vite/commands"),
	],
	providers: [
		() => import("@adonisjs/core/providers/app_provider"),
		() => import("@adonisjs/core/providers/hash_provider"),
		{
			file: () => import("@adonisjs/core/providers/repl_provider"),
			environment: ["repl", "test"],
		},
		() => import("@adonisjs/session/session_provider"),
		() => import("@adonisjs/shield/shield_provider"),
		() => import("@adonisjs/static/static_provider"),
		() => import("@adonisjs/vite/vite_provider"),
		() => import("@adonisjs/inertia/inertia_provider"),
	],
	preloads: [() => import("#start/routes")],
	metaFiles: [
		{
			pattern: "public/**",
			reloadServer: false,
		},
		{
			pattern: "resources/views/**/*.edge",
			reloadServer: false,
		},
	],
	assetsBundler: false,
	hooks: {
		onBuildStarting: [() => import("@adonisjs/vite/build_hook")],
	},
});
