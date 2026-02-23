import { useEffect } from "react";
import { PageHeader } from "@/components/header/common.header";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { useCreateAndNavigate } from "@/hooks/use-document-queries";
import { Logger } from "@/lib/logger";
import { PageErrorBoundary } from "@/pages/share/error.page";

const logger = new Logger("home-page");

function HomePage() {
	const { createAndNavigate, isPending } = useCreateAndNavigate();

	return (
		<div className="min-h-screen flex flex-col bg-linear-to-b from-muted/30 to-background">
			<PageHeader />
			<main className="container mx-auto px-4 py-8 max-w-2xl text-center space-y-10 pt-20">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Build your Resume in minutes</h1>
				<p className="text-lg text-muted-foreground">
					Create, edit, and manage professional resumes with an easy drag-and-drop builder. No design skills needed.
				</p>
				<div className="flex flex-wrap gap-4 justify-center">
					<Button asChild size="lg">
						<NavLink to="/my-resumes">My resumes</NavLink>
					</Button>
					<Button variant="outline" size="lg" onClick={createAndNavigate} disabled={isPending}>
						{isPending ? "Creating…" : "New resume"}
					</Button>
				</div>
			</main>
		</div>
	);
}

export default function HomePageWithErrorBoundary() {
	useEffect(() => {
		logger.info("page view");
	}, []);
	return (
		<PageErrorBoundary>
			<HomePage />
		</PageErrorBoundary>
	);
}
