import { BaseModel, belongsTo, column } from "@adonisjs/lucid/orm";
import type { BelongsTo } from "@adonisjs/lucid/types/relations";
import type { DateTime } from "luxon";
import Board from "./board.js";
import User from "./user.js";

export default class CheckIn extends BaseModel {
	static table = "check_ins";

	@column({ isPrimary: true })
	declare id: string;

	@column()
	declare boardId: string;

	@column()
	declare userId: string;

	@column()
	declare date: string;

	@column.dateTime()
	declare timestamp: DateTime;

	@column()
	declare amount: number | null;

	@column()
	declare note: string | null;

	@column()
	declare sessionNumber: number;

	@column.dateTime({ autoCreate: true })
	declare createdAt: DateTime;

	@belongsTo(() => User)
	declare user: BelongsTo<typeof User>;

	@belongsTo(() => Board)
	declare board: BelongsTo<typeof Board>;
}
