import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Checker - Track Your Habits",
	description:
		"Build better habits with Checker. Track your progress, maintain streaks, and achieve your goals with our simple habit tracking API.",
	keywords: ["habit tracker", "habits", "productivity", "goals", "streaks"],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className="antialiased">{children}</body>
		</html>
	);
}
