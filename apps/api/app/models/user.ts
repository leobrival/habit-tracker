import { DbAccessTokensProvider } from "@adonisjs/auth/access_tokens";
import { withAuthFinder } from "@adonisjs/auth/mixins/lucid";
import { compose } from "@adonisjs/core/helpers";
import hash from "@adonisjs/core/services/hash";
import { BaseModel, column, hasMany } from "@adonisjs/lucid/orm";
import type { HasMany } from "@adonisjs/lucid/types/relations";
import type { DateTime } from "luxon";
import ApiKey from "./api_key.js";
import Board from "./board.js";
import CheckIn from "./check_in.js";

const AuthFinder = withAuthFinder(() => hash.use("scrypt"), {
	uids: ["email"],
	passwordColumnName: "password",
});

export default class User extends compose(BaseModel, AuthFinder) {
	static accessTokens = DbAccessTokensProvider.forModel(User);
	@column({ isPrimary: true })
	declare id: string;

	@column()
	declare email: string;

	@column()
	declare name: string | null;

	@column()
	declare image: string | null;

	@column({ serializeAs: null })
	declare password: string | null;

	@column()
	declare timezone: string;

	@column()
	declare theme: string;

	@column()
	declare notificationSettings: Record<string, unknown>;

	@column.dateTime()
	declare emailVerified: DateTime | null;

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime;

	@hasMany(() => ApiKey)
	declare apiKeys: HasMany<typeof ApiKey>;

	@hasMany(() => Board)
	declare boards: HasMany<typeof Board>;

	@hasMany(() => CheckIn)
	declare checkIns: HasMany<typeof CheckIn>;
}
