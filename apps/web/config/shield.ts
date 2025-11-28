import { defineConfig } from "@adonisjs/shield";

export default defineConfig({
	csp: {
		enabled: false,
	},
	csrf: {
		enabled: true,
		exceptRoutes: [],
	},
	hsts: {
		enabled: true,
		maxAge: "180 days",
	},
	contentTypeSniffing: {
		enabled: true,
	},
});
