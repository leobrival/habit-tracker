export default function Home() {
	return (
		<main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
			<div className="container mx-auto px-4 py-16">
				<nav className="flex items-center justify-between mb-16">
					<div className="text-2xl font-bold text-white">Checker</div>
					<div className="flex gap-4">
						<a
							href="#features"
							className="text-slate-300 hover:text-white transition"
						>
							Features
						</a>
						<a
							href="#pricing"
							className="text-slate-300 hover:text-white transition"
						>
							Pricing
						</a>
						<a
							href="/login"
							className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition"
						>
							Get Started
						</a>
					</div>
				</nav>

				<section className="text-center py-20">
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
						Build Better Habits
					</h1>
					<p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
						Track your progress, maintain streaks, and achieve your goals with
						our simple yet powerful habit tracking platform.
					</p>
					<div className="flex gap-4 justify-center">
						<a
							href="/signup"
							className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
						>
							Start Free
						</a>
						<a
							href="#demo"
							className="border border-slate-600 hover:border-slate-500 text-white px-8 py-3 rounded-lg text-lg font-medium transition"
						>
							View Demo
						</a>
					</div>
				</section>

				<section id="features" className="py-20">
					<h2 className="text-3xl font-bold text-white text-center mb-12">
						Features
					</h2>
					<div className="grid md:grid-cols-3 gap-8">
						<div className="bg-slate-800/50 p-6 rounded-xl">
							<div className="text-4xl mb-4">📊</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Visual Progress
							</h3>
							<p className="text-slate-400">
								Beautiful heatmaps and charts to visualize your habit
								consistency over time.
							</p>
						</div>
						<div className="bg-slate-800/50 p-6 rounded-xl">
							<div className="text-4xl mb-4">🔥</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Streak Tracking
							</h3>
							<p className="text-slate-400">
								Stay motivated with automatic streak counting and personal
								records.
							</p>
						</div>
						<div className="bg-slate-800/50 p-6 rounded-xl">
							<div className="text-4xl mb-4">⚡</div>
							<h3 className="text-xl font-semibold text-white mb-2">
								Quick Actions
							</h3>
							<p className="text-slate-400">
								Check in from anywhere with Raycast, CLI, or our mobile-friendly
								API.
							</p>
						</div>
					</div>
				</section>
			</div>
		</main>
	);
}
