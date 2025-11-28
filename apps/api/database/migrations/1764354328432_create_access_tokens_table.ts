import { BaseSchema } from "@adonisjs/lucid/schema";

export default class extends BaseSchema {
	protected tableName = "api_keys";

	async up() {
		this.schema.createTable(this.tableName, (table) => {
			table.uuid("id").primary().defaultTo(this.raw("gen_random_uuid()"));
			table
				.uuid("user_id")
				.notNullable()
				.references("id")
				.inTable("users")
				.onDelete("CASCADE");
			table.string("name", 100).notNullable();
			table.string("key_hash", 255).notNullable();
			table.string("key_prefix", 12).notNullable();
			table
				.specificType("scopes", "varchar(255)[]")
				.notNullable()
				.defaultTo("{read}");
			table.timestamp("expires_at").nullable();
			table.timestamp("last_used_at").nullable();
			table.string("last_used_ip", 45).nullable();
			table.boolean("is_revoked").notNullable().defaultTo(false);
			table.timestamp("revoked_at").nullable();

			table.timestamp("created_at").notNullable();
			table.timestamp("updated_at").notNullable();
		});

		this.schema.raw("CREATE INDEX idx_api_keys_user_id ON api_keys(user_id)");
		this.schema.raw(
			"CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix)",
		);
		this.schema.raw(
			"CREATE INDEX idx_api_keys_active ON api_keys(user_id, is_revoked) WHERE is_revoked = FALSE",
		);
	}

	async down() {
		this.schema.dropTable(this.tableName);
	}
}
