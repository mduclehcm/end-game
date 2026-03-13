import { PageHeader } from "@/components/header/common.header";
import { ExportList } from "@/components/my-resumes/export-list";
import { ExportListHeader } from "@/components/my-resumes/export-list-header";
import { Page } from "../share/page";

const ExportsPage = Page(() => {
	return (
		<div className="min-h-screen bg-background">
			<PageHeader />
			<main className="container mx-auto px-4 py-8">
				<ExportListHeader />
				<ExportList />
			</main>
		</div>
	);
});

ExportsPage.displayName = "ExportsPage";

export default ExportsPage;
