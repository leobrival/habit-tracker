import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import { DateTime } from "luxon";
import User from "./user.js";

export default class ApiKey extends BaseModel {
	static table = "api_keys";

	@column({ isPrimary: true })
	declare id: string;

	@column()
	declare userId: string;

	@column()
	declare name: string;

	@column({ serializeAs: null })
	declare keyHash: string;

	@column()
	declare keyPrefix: string;

	@column()
	declare scopes: string[];

	@column.dateTime()
	declare expiresAt: DateTime | null;

	@column.dateTime()
	declare lastUsedAt: DateTime | null;

	@column()
	declare lastUsedIp: string | null;

	@column()
	declare isRevoked: boolean;

	@column.dateTime()
	declare revokedAt: DateTime | null;

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime;

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>;

	/**
	 * Check if the API key has a specific scope
	 */
	hasScope(scope: string): boolean {
		return this.scopes.includes(scope) || this.scopes.includes("admin");
	}

	/**
	 * Check if the API key is valid (not expired and not revoked)
	 */
	isValid(): boolean {
		if (this.isRevoked) return false;
		if (this.expiresAt && this.expiresAt < DateTime.now()) return false;
		return true;
	}
}
