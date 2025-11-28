import adonisjs from "@adonisjs/vite/client";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		react(),
		adonisjs({
			entrypoints: ["inertia/app/app.tsx"],
			reload: ["resources/views/**/*.edge"],
		}),
	],
});
