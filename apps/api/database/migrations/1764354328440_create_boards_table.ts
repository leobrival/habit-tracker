import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
	protected tableName = "boards";

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid("id").primary().defaultTo(this.raw("gen_random_uuid()"));
			table
				.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.string("name", 50).notNullable();
			table.string("description", 500).nullable();
			table.string("emoji", 10).defaultTo("📊");
			table.string("color", 7).defaultTo("#3B82F6");
			table.string("unit_type", 20).notNullable();
			table.string("unit", 20).nullable();
			table.decimal("target_amount", 10, 2).nullable();
			table.integer("current_streak").notNullable().defaultTo(0);
			table.integer("longest_streak").notNullable().defaultTo(0);
			table.integer("total_check_ins").notNullable().defaultTo(0);
			table.boolean("is_archived").notNullable().defaultTo(false);
			table.timestamp("archived_at").nullable();
			table.date("last_check_in_date").nullable();

			table.timestamp("created_at").notNullable();
			table.timestamp("updated_at").notNullable();

			table.unique(["user_id", "name"]);
		});

		this.schema.raw("CREATE INDEX idx_boards_user_id ON boards(user_id)");
		this.schema.raw(
			"CREATE INDEX idx_boards_user_active ON boards(user_id, is_archived) WHERE is_archived = FALSE",
		);
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
