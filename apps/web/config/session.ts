import { defineConfig, stores } from "@adonisjs/session";
import env from "#start/env";

export default defineConfig({
	enabled: true,
	cookieName: "adonis-session",
	clearWithBrowser: false,
	age: "2h",
	cookie: {
		path: "/",
		httpOnly: true,
		secure: env.get("NODE_ENV") === "production",
		sameSite: "lax",
	},
	store: env.get("SESSION_DRIVER", "cookie"),
	stores: {
		cookie: stores.cookie(),
	},
});
