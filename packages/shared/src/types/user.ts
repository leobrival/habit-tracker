export interface User {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	timezone: string;
	theme: "light" | "dark" | "system";
	createdAt: string;
	updatedAt: string;
}

export interface UserPreferences {
	timezone: string;
	theme: "light" | "dark" | "system";
	notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
	email: boolean;
	push: boolean;
	reminderTime: string | null;
}
