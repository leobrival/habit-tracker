import type { ReactNode } from "react";

interface Props {
	children: ReactNode;
}

export default function Layout({ children }: Props) {
	return (
		<div className="min-h-screen bg-slate-50">
			<nav className="bg-white border-b border-slate-200">
				<div className="max-w-7xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<a href="/" className="text-xl font-bold text-slate-900">
							Checker
						</a>
						<div className="flex gap-6">
							<a
								href="/boards"
								className="text-slate-600 hover:text-slate-900 transition"
							>
								Boards
							</a>
							<a
								href="/settings"
								className="text-slate-600 hover:text-slate-900 transition"
							>
								Settings
							</a>
						</div>
					</div>
				</div>
			</nav>
			<main className="max-w-7xl mx-auto">{children}</main>
		</div>
	);
}
