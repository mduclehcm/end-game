import { ResumeCard } from "@/components/my-resumes/resume-card";
import { useDocumentList } from "@/hooks/use-document-queries";

export function MyResumeList() {
	const documents = useDocumentList();

	return (
		<section>
			{documents.length === 0 ? (
				<p className="text-muted-foreground text-center py-6 border border-dashed rounded-lg">
					No resumes yet. Create one to get started. Resumes are saved to the cloud and backed up locally for offline
					use.
				</p>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{documents.map((item) => (
						<ResumeCard key={item.id} resume={item} />
					))}
				</div>
			)}
		</section>
	);
}
