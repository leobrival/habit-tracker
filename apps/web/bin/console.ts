import "reflect-metadata";
import { Ignitor } from "@adonisjs/core";

const APP_ROOT = new URL("../", import.meta.url);

const ignitor = new Ignitor(APP_ROOT);

ignitor
	.tap((app) => {
		app.booting(async () => {
			await import("#start/env");
		});
	})
	.ace()
	.handle(process.argv.slice(2))
	.catch(console.error);
