import type { HttpContext } from "@adonisjs/core/http";
import ApiKey from "#models/api_key";
import ApiKeyService from "#services/api_key_service";

export default class ApiKeysController {
	/**
	 * GET /v1/api-keys
	 * List all API keys for authenticated user
	 */
	async index({ auth, response }: HttpContext) {
		const apiKeys = await ApiKey.query()
			.where("userId", auth.user!.id)
			.where("isRevoked", false)
			.orderBy("createdAt", "desc");

		return response.ok({
			data: apiKeys.map((key) => ({
				id: key.id,
				name: key.name,
				keyPrefix: key.keyPrefix,
				scopes: key.scopes,
				lastUsedAt: key.lastUsedAt,
				lastUsedIp: key.lastUsedIp,
				expiresAt: key.expiresAt,
				createdAt: key.createdAt,
			})),
		});
	}

	/**
	 * POST /v1/api-keys
	 * Create a new API key
	 */
	async store({ auth, request, response }: HttpContext) {
		const { name, scopes, expiresInDays } = request.only([
			"name",
			"scopes",
			"expiresInDays",
		]);

		const { apiKey, rawKey } = await ApiKeyService.createForUser(
			auth.user!.id,
			name || "API Key",
			scopes || ["read", "write"],
			expiresInDays,
		);

		return response.created({
			data: {
				id: apiKey.id,
				name: apiKey.name,
				key: rawKey,
				keyPrefix: apiKey.keyPrefix,
				scopes: apiKey.scopes,
				expiresAt: apiKey.expiresAt,
				createdAt: apiKey.createdAt,
			},
			meta: {
				message:
					"API key created. Store it securely - it won't be shown again.",
			},
		});
	}

	/**
	 * DELETE /v1/api-keys/:id
	 * Revoke an API key
	 */
	async destroy({ auth, params, response }: HttpContext) {
		const apiKey = await ApiKey.query()
			.where("id", params.id)
			.where("userId", auth.user!.id)
			.where("isRevoked", false)
			.first();

		if (!apiKey) {
			return response.notFound({
				error: {
					code: "NOT_FOUND",
					message: "API key not found.",
				},
			});
		}

		await ApiKeyService.revoke(apiKey);

		return response.ok({
			data: {
				id: apiKey.id,
				revokedAt: apiKey.revokedAt,
			},
			meta: {
				message: "API key revoked successfully.",
			},
		});
	}
}
