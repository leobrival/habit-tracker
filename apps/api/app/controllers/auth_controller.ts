import type { HttpContext } from "@adonisjs/core/http";
import hash from "@adonisjs/core/services/hash";
import User from "#models/user";
import ApiKeyService from "#services/api_key_service";

export default class AuthController {
	/**
	 * POST /v1/auth/register
	 * Create a new user account with default API key
	 */
	async register({ request, response }: HttpContext) {
		const { email, password, name, timezone } = request.only([
			"email",
			"password",
			"name",
			"timezone",
		]);

		// Check if user exists
		const existingUser = await User.findBy("email", email);
		if (existingUser) {
			return response.conflict({
				error: {
					code: "USER_EXISTS",
					message: "A user with this email already exists.",
				},
			});
		}

		// Create user
		const user = await User.create({
			email,
			password: await hash.make(password),
			name: name || null,
			timezone: timezone || "UTC",
			theme: "system",
			notificationSettings: {},
		});

		// Create default API key
		const { apiKey, rawKey } = await ApiKeyService.createForUser(
			user.id,
			"Default Key",
			["read", "write"],
		);

		return response.created({
			data: {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					timezone: user.timezone,
					createdAt: user.createdAt,
				},
				apiKey: {
					id: apiKey.id,
					name: apiKey.name,
					key: rawKey,
					keyPrefix: apiKey.keyPrefix,
					scopes: apiKey.scopes,
					expiresAt: apiKey.expiresAt,
				},
			},
			meta: {
				message:
					"Account created successfully. Store your API key securely - it won't be shown again.",
			},
		});
	}

	/**
	 * POST /v1/auth/login
	 * Authenticate and list user's API keys
	 */
	async login({ request, response }: HttpContext) {
		const { email, password } = request.only(["email", "password"]);

		const user = await User.findBy("email", email);
		if (!user || !user.password) {
			return response.unauthorized({
				error: {
					code: "INVALID_CREDENTIALS",
					message: "Invalid email or password.",
				},
			});
		}

		const isValid = await hash.verify(user.password, password);
		if (!isValid) {
			return response.unauthorized({
				error: {
					code: "INVALID_CREDENTIALS",
					message: "Invalid email or password.",
				},
			});
		}

		// Load API keys
		await user.load("apiKeys", (query) => {
			query.where("isRevoked", false);
		});

		return response.ok({
			data: {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					timezone: user.timezone,
				},
				apiKeys: user.apiKeys.map((key) => ({
					id: key.id,
					name: key.name,
					keyPrefix: key.keyPrefix,
					scopes: key.scopes,
					lastUsedAt: key.lastUsedAt,
					expiresAt: key.expiresAt,
				})),
			},
		});
	}
}
