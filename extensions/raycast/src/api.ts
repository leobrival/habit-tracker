import { getPreferenceValues } from "@raycast/api";

interface Preferences {
	apiKey: string;
	apiUrl: string;
}

export interface Board {
	id: string;
	name: string;
	emoji: string;
	color: string;
	currentStreak: number;
	longestStreak: number;
	totalCheckIns: number;
	lastCheckInDate: string | null;
}

export interface CheckIn {
	id: string;
	boardId: string;
	date: string;
	amount: number;
	note: string | null;
}

export interface QuickStatus {
	boards: Array<{
		id: string;
		name: string;
		emoji: string;
		checkedInToday: boolean;
		currentStreak: number;
	}>;
}

function getApiConfig() {
	const preferences = getPreferenceValues<Preferences>();
	return {
		baseUrl: preferences.apiUrl || "https://api.checker.app",
		apiKey: preferences.apiKey,
	};
}

async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {},
): Promise<T> {
	const { baseUrl, apiKey } = getApiConfig();

	const response = await fetch(`${baseUrl}${endpoint}`, {
		...options,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
			...options.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	return response.json() as Promise<T>;
}

export async function getBoards(): Promise<Board[]> {
	return fetchApi<Board[]>("/v1/boards");
}

export async function quickCheckIn(
	boardId: string,
	amount = 1,
): Promise<CheckIn> {
	return fetchApi<CheckIn>("/v1/quick/check-in", {
		method: "POST",
		body: JSON.stringify({ boardId, amount }),
	});
}

export async function getQuickStatus(): Promise<QuickStatus> {
	return fetchApi<QuickStatus>("/v1/quick/status");
}
