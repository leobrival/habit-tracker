import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
	protected tableName = "users";

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid("id").primary().defaultTo(this.raw("gen_random_uuid()"));
			table.string("email", 255).notNullable().unique();
			table.timestamp("email_verified").nullable();
			table.string("name", 100).nullable();
			table.string("image", 500).nullable();
			table.string("password").nullable();
			table.string("timezone", 50).notNullable().defaultTo("UTC");
			table.string("theme", 10).defaultTo("system");
			table.jsonb("notification_settings").defaultTo("{}");

			table.timestamp("created_at").notNullable();
			table.timestamp("updated_at").notNullable();
		});

		this.schema.raw("CREATE INDEX idx_users_email ON users(email)");
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
