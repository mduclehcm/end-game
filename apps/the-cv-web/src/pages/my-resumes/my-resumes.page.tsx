import { useEffect } from "react";
import { PageHeader } from "@/components/header/common.header";
import { MyResumeList } from "@/components/my-resumes/my-resume-list";
import { Logger } from "@/lib/logger";
import { Page } from "../share/page";
import { ResumeListHeader } from "./resume-list-header";

const logger = new Logger("my-resume-page");

const MyResumesPage = Page(() => {
	useEffect(() => {
		logger.info("page view");
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<PageHeader />
			<main className="container mx-auto px-4 py-8">
				<ResumeListHeader />
				<MyResumeList />
			</main>
		</div>
	);
});

MyResumesPage.displayName = "MyResumesPage";

export default MyResumesPage;
