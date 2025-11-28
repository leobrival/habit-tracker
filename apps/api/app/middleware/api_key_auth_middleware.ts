import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import type ApiKey from "#models/api_key";
import type User from "#models/user";
import ApiKeyService from "#services/api_key_service";

// Extend HttpContext to include our custom auth
declare module "@adonisjs/core/http" {
	interface HttpContext {
		auth: {
			user: User;
			apiKey: ApiKey;
			isAuthenticated: boolean;
		};
	}
}

export default class ApiKeyAuthMiddleware {
	async handle(
		ctx: HttpContext,
		next: NextFn,
		options: { scopes?: string[] } = {},
	) {
		const requiredScopes = options.scopes || ["read"];

		const authHeader = ctx.request.header("Authorization");
		const apiKeyHeader = ctx.request.header("X-API-Key");

		const key = this.extractKey(authHeader, apiKeyHeader);

		if (!key) {
			return ctx.response.unauthorized({
				error: {
					code: "MISSING_API_KEY",
					message:
						"API key required. Provide via Authorization: Bearer <key> or X-API-Key header.",
				},
			});
		}

		const apiKey = await ApiKeyService.findByKey(key);

		if (!apiKey) {
			return ctx.response.unauthorized({
				error: {
					code: "INVALID_API_KEY",
					message: "Invalid or revoked API key.",
				},
			});
		}

		if (!apiKey.isValid()) {
			return ctx.response.unauthorized({
				error: {
					code: "EXPIRED_API_KEY",
					message: "API key has expired. Generate a new key.",
				},
			});
		}

		// Check scopes
		const hasRequiredScopes = requiredScopes.every((scope) =>
			apiKey.hasScope(scope),
		);

		if (!hasRequiredScopes) {
			return ctx.response.forbidden({
				error: {
					code: "INSUFFICIENT_SCOPE",
					message: `This action requires scope(s): ${requiredScopes.join(", ")}`,
				},
			});
		}

		// Update last used
		await ApiKeyService.recordUsage(apiKey, ctx.request.ip());

		// Attach user to context - user is preloaded in findByKey
		ctx.auth = {
			user: apiKey.user as unknown as User,
			apiKey,
			isAuthenticated: true,
		};

		return next();
	}

	private extractKey(
		authHeader?: string,
		apiKeyHeader?: string,
	): string | null {
		if (apiKeyHeader) {
			return apiKeyHeader;
		}

		if (authHeader?.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}

		return null;
	}
}
