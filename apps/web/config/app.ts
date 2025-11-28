import { defineConfig } from "@adonisjs/core/app";
import { Secret } from "@adonisjs/core/helpers";
import env from "#start/env";

export default defineConfig({
	appKey: new Secret(env.get("APP_KEY")),
	http: {
		generateRequestId: true,
		allowMethodSpoofing: false,
		useAsyncLocalStorage: true,
	},
	profiler: {
		enabled: env.get("NODE_ENV") === "development",
	},
});
