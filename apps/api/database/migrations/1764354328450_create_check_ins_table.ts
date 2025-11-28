import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
	protected tableName = "check_ins";

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid("id").primary().defaultTo(this.raw("gen_random_uuid()"));
			table
				.uuid("board_id")
				.notNullable()
				.references("id")
				.inTable("boards")
				.onDelete("CASCADE");
			table
				.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.date("date").notNullable();
			table.timestamp("timestamp").notNullable();
			table.decimal("amount", 10, 2).nullable();
			table.string("note", 500).nullable();
			table.integer("session_number").notNullable().defaultTo(1);

			table.timestamp("created_at").notNullable();
		});

		this.schema.raw(
			"CREATE INDEX idx_check_ins_board_id ON check_ins(board_id)",
		);
		this.schema.raw(
			"CREATE INDEX idx_check_ins_board_date ON check_ins(board_id, date)",
		);
		this.schema.raw(
			"CREATE INDEX idx_check_ins_user_date ON check_ins(user_id, date)",
		);
		this.schema.raw(
			"CREATE INDEX idx_check_ins_board_timestamp ON check_ins(board_id, timestamp DESC)",
		);
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
