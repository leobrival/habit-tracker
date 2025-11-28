import { BaseModel, belongsTo, column, hasMany } from "@adonisjs/lucid/orm";
import type { BelongsTo, HasMany } from "@adonisjs/lucid/types/relations";
import type { DateTime } from "luxon";
import CheckIn from "./check_in.js";
import User from "./user.js";

export default class Board extends BaseModel {
	@column({ isPrimary: true })
	declare id: string;

	@column()
	declare userId: string;

	@column()
	declare name: string;

	@column()
	declare description: string | null;

	@column()
	declare emoji: string;

	@column()
	declare color: string;

	@column()
	declare unitType: string;

	@column()
	declare unit: string | null;

	@column()
	declare targetAmount: number | null;

	@column()
	declare currentStreak: number;

	@column()
	declare longestStreak: number;

	@column()
	declare totalCheckIns: number;

	@column()
	declare isArchived: boolean;

	@column.dateTime()
	declare archivedAt: DateTime | null;

	@column()
	declare lastCheckInDate: string | null;

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime;

	@column.dateTime({ autoCreate: true, autoUpdate: true })
	declare updatedAt: DateTime;

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>;

	@hasMany(() => CheckIn)
	declare checkIns: HasMany<typeof CheckIn>;
}
