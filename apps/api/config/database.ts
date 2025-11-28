import { defineConfig } from "@adonisjs/lucid";
import env from "#start/env";

const dbConfig = defineConfig({
	connection: "postgres",
	connections: {
		postgres: {
			client: "pg",
			connection: env.get("DATABASE_URL"),
			migrations: {
				naturalSort: true,
				paths: ["database/migrations"],
			},
			pool: {
				min: 2,
				max: 10,
			},
			debug: false,
		},
	},
});

export default dbConfig;
