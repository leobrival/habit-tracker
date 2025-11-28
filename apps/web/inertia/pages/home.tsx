import { Head } from "@inertiajs/react";
import Layout from "../components/layout";

interface Props {
	title: string;
}

export default function Home({ title }: Props) {
	return (
		<Layout>
			<Head title={title} />
			<div className="p-8">
				<h1 className="text-3xl font-bold text-slate-900 mb-4">
					Welcome to Checker
				</h1>
				<p className="text-slate-600">
					Track your habits and build consistency.
				</p>
			</div>
		</Layout>
	);
}
