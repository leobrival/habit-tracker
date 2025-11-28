export interface ApiError {
	error: {
		code: string;
		message: string;
	};
}

export interface ApiKey {
	id: string;
	userId: string;
	name: string;
	keyPrefix: string;
	scopes: ApiKeyScope[];
	expiresAt: string | null;
	lastUsedAt: string | null;
	lastUsedIp: string | null;
	isRevoked: boolean;
	revokedAt: string | null;
	createdAt: string;
}

export type ApiKeyScope = "read" | "write" | "delete" | "admin";

export interface CreateApiKeyInput {
	name: string;
	scopes?: ApiKeyScope[];
	expiresAt?: string;
}

export interface CreateApiKeyResponse {
	apiKey: ApiKey;
	key: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		total: number;
		page: number;
		perPage: number;
		lastPage: number;
	};
}
