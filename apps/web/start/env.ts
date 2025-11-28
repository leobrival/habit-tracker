import { Env } from "@adonisjs/core/env";

export default await Env.create(new URL("../", import.meta.url), {
	NODE_ENV: Env.schema.enum(["development", "production", "test"]),
	PORT: Env.schema.number(),
	HOST: Env.schema.string({ format: "host" }),
	APP_KEY: Env.schema.string(),
	SESSION_DRIVER: Env.schema.enum(["cookie", "memory"]).optional(),
});
