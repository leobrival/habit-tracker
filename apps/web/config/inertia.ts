import { defineConfig } from "@adonisjs/inertia";

export default defineConfig({
	rootView: "inertia_layout",
	sharedData: {
		errors: (ctx) => ctx.session?.flashMessages.get("errors"),
	},
	ssr: {
		enabled: false,
	},
});
