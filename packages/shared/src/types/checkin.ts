export interface CheckIn {
	id: string;
	boardId: string;
	userId: string;
	date: string;
	timestamp: string;
	amount: number;
	note: string | null;
	sessionNumber: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCheckInInput {
	boardId: string;
	date?: string;
	amount?: number;
	note?: string;
}

export interface UpdateCheckInInput {
	amount?: number;
	note?: string;
}

export interface QuickCheckInInput {
	boardId: string;
	amount?: number;
}

export interface QuickStatus {
	boards: QuickStatusBoard[];
}

export interface QuickStatusBoard {
	id: string;
	name: string;
	emoji: string;
	checkedInToday: boolean;
	currentStreak: number;
}
