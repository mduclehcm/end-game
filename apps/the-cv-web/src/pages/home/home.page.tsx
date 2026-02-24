import { useEffect } from "react";
import { PageHeader } from "@/components/header/common.header";
import { CreateResumeDialog } from "@/components/my-resumes/create-resume-dialog";
import { NavLink } from "@/components/nav-link";
import { Button } from "@/components/ui/button";
import { Logger } from "@/lib/logger";
import { Page } from "../share/page";

const logger = new Logger("home-page");

const HomePage = Page(() => {
	useEffect(() => {
		logger.info("page view");
	}, []);

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
					<CreateResumeDialog>
						<Button variant="outline" size="lg">
							New resume
						</Button>
					</CreateResumeDialog>
				</div>
			</main>
		</div>
	);
});

HomePage.displayName = "HomePage";

export default HomePage;
