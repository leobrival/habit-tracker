import { BaseCommand, args, flags } from "@adonisjs/core/ace";
import type { CommandOptions } from "@adonisjs/core/types/ace";
import User from "#models/user";
import ApiKeyService from "#services/api_key_service";

export default class CreateApiKey extends BaseCommand {
	static commandName = "create:api-key";
	static description = "Create an API key for a user";

	static options: CommandOptions = {
		startApp: true,
	};

	@args.string({ description: "User email address" })
	declare email: string;

	@flags.string({ alias: "n", description: "Name/label for the API key" })
	declare name: string;

	@flags.array({ alias: "s", description: "Scopes for the API key" })
	declare scopes: string[];

	async run() {
		const user = await User.findBy("email", this.email);

		if (!user) {
			this.logger.error(`User with email "${this.email}" not found`);
			return;
		}

		const keyName = this.name || "CLI Generated Key";
		const keyScopes = this.scopes?.length ? this.scopes : ["read", "write"];

		const { apiKey, rawKey } = await ApiKeyService.createForUser(
			user.id,
			keyName,
			keyScopes,
		);

		this.logger.success(`API key created successfully for ${user.email}`);
		this.logger.info(`Key ID: ${apiKey.id}`);
		this.logger.info(`Name: ${keyName}`);
		this.logger.info(`Scopes: ${keyScopes.join(", ")}`);
		this.logger.info("");
		this.logger.warning("Save this key - it won't be shown again:");
		this.logger.info("");
		console.log(rawKey);
		this.logger.info("");
	}
}
