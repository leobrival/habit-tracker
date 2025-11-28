export type UnitType = "boolean" | "quantity" | "duration";

export interface Board {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	emoji: string;
	color: string;
	unitType: UnitType;
	unit: string | null;
	targetAmount: number | null;
	currentStreak: number;
	longestStreak: number;
	totalCheckIns: number;
	isArchived: boolean;
	archivedAt: string | null;
	lastCheckInDate: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateBoardInput {
	name: string;
	description?: string;
	emoji?: string;
	color?: string;
	unitType: UnitType;
	unit?: string;
	targetAmount?: number;
}

export interface UpdateBoardInput {
	name?: string;
	description?: string;
	emoji?: string;
	color?: string;
	targetAmount?: number;
}

export interface BoardStats {
	currentStreak: number;
	longestStreak: number;
	totalCheckIns: number;
	completionRate: number;
	averagePerDay: number;
}

export interface BoardHeatmap {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
}
