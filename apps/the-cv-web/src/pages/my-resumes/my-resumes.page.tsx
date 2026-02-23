import { useEffect } from "react";
import { PageHeader } from "@/components/header/common.header";
import { useCreateAndNavigate, useDocumentListQuery } from "@/hooks/use-document-queries";
import { Logger } from "@/lib/logger";
import { PageErrorBoundary } from "@/pages/share/error.page";
import { ResumeCard } from "./resume-card";
import { ResumeCardSkeleton } from "./resume-card-skeleton";
import { ResumeListHeader } from "./resume-list-header";

const logger = new Logger("my-resume-page");

function MyResumesPage() {
	const documentListQuery = useDocumentListQuery();
	const { createAndNavigate, isPending } = useCreateAndNavigate();

	const documents = documentListQuery.data ?? [];
	const isEmpty = documents.length === 0;

	return (
		<div className="min-h-screen bg-background">
			<PageHeader />
			<main className="container mx-auto px-4 py-8">
				<ResumeListHeader onCreateClick={createAndNavigate} isCreating={isPending} />
				{documentListQuery.isLoading ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<ResumeCardSkeleton key={i} />
						))}
					</div>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{documents.map((resume) => (
							<ResumeCard key={resume.id} resume={resume} />
						))}
						{isEmpty && (
							<p className="col-span-full text-muted-foreground text-center py-8">
								No resumes yet. Create your first resume to get started.
							</p>
						)}
					</div>
				)}
			</main>
		</div>
	);
}

export default function MyResumesPageWithErrorBoundary() {
	useEffect(() => {
		logger.info("page view");
	}, []);

	return (
		<PageErrorBoundary>
			<MyResumesPage />
		</PageErrorBoundary>
	);
}
