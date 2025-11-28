import "reflect-metadata";
import { Ignitor } from "@adonisjs/core";

const APP_ROOT = new URL("../", import.meta.url);

const ignitor = new Ignitor(APP_ROOT);

ignitor
	.tap((app) => {
		app.booting(async () => {
			await import("#start/env");
		});
		app.listen("SIGTERM", () => app.terminate());
		app.listenIf(app.managedByPm2, "SIGINT", () => app.terminate());
	})
	.httpServer()
	.start()
	.catch(console.error);
