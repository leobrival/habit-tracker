import { createHash, randomBytes } from "node:crypto";
import { DateTime } from "luxon";
import ApiKey from "#models/api_key";

export interface GeneratedApiKey {
	key: string;
	hash: string;
	prefix: string;
}

export default class ApiKeyService {
	/**
	 * Generate a new API key with cryptographically secure random bytes
	 */
	static generateKey(environment: "live" | "test" = "live"): GeneratedApiKey {
		const randomPart = randomBytes(32).toString("base64url");
		const key = `chk_${environment}_${randomPart}`;
		const hash = createHash("sha256").update(key).digest("hex");
		// Prefix limited to 12 chars to match database column
		const prefix = key.substring(0, 12);

		return { key, hash, prefix };
	}

	/**
	 * Hash an API key for storage
	 */
	static hashKey(key: string): string {
		return createHash("sha256").update(key).digest("hex");
	}

	/**
	 * Extract prefix from API key for lookup (12 chars to match DB column)
	 */
	static extractPrefix(key: string): string {
		return key.substring(0, 12);
	}

	/**
	 * Validate API key format
	 */
	static isValidFormat(key: string): boolean {
		return /^chk_(live|test)_[A-Za-z0-9_-]{43}$/.test(key);
	}

	/**
	 * Find and validate an API key
	 */
	static async findByKey(key: string): Promise<ApiKey | null> {
		if (!ApiKeyService.isValidFormat(key)) {
			return null;
		}

		const prefix = ApiKeyService.extractPrefix(key);
		const hash = ApiKeyService.hashKey(key);

		const apiKey = await ApiKey.query()
			.where("keyPrefix", prefix)
			.where("keyHash", hash)
			.where("isRevoked", false)
			.preload("user")
			.first();

		return apiKey;
	}

	/**
	 * Create a new API key for a user
	 */
	static async createForUser(
		userId: string,
		name: string,
		scopes: string[] = ["read"],
		expiresInDays?: number,
	): Promise<{ apiKey: ApiKey; rawKey: string }> {
		const { key, hash, prefix } = ApiKeyService.generateKey("live");

		const expiresAt = expiresInDays
			? DateTime.now().plus({ days: expiresInDays })
			: null;

		const apiKey = await ApiKey.create({
			userId,
			name,
			keyHash: hash,
			keyPrefix: prefix,
			scopes,
			expiresAt: expiresAt ?? undefined,
		});

		return { apiKey, rawKey: key };
	}

	/**
	 * Revoke an API key
	 */
	static async revoke(apiKey: ApiKey): Promise<ApiKey> {
		apiKey.isRevoked = true;
		apiKey.revokedAt = DateTime.now();
		await apiKey.save();
		return apiKey;
	}

	/**
	 * Update last used timestamp and IP
	 */
	static async recordUsage(apiKey: ApiKey, ip: string): Promise<void> {
		apiKey.lastUsedAt = DateTime.now();
		apiKey.lastUsedIp = ip;
		await apiKey.save();
	}
}
