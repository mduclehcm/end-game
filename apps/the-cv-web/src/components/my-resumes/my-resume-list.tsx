import { AlertCircle } from "lucide-react";
import { ResumeCard } from "@/components/my-resumes/resume-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocumentList } from "@/hooks/use-document-queries";

function ResumeListSkeleton() {
	const placeholders = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`);
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{placeholders.map((id) => (
				<Card key={id}>
					<CardHeader className="flex flex-row items-start justify-between gap-2">
						<div className="space-y-1.5 min-w-0 flex-1">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					</CardHeader>
				</Card>
			))}
		</div>
	);
}

export function MyResumeList() {
	const { documents, isListLoading, isListError, listError, refetchList } = useDocumentList();
	const errorMessage = listError instanceof Error ? listError.message : "Failed to load resumes.";

	return (
		<section className="space-y-4">
			{isListError && (
				<Alert variant="destructive" className="py-3">
					<AlertCircle className="size-4" />
					<AlertTitle>Could not load resumes</AlertTitle>
					<AlertDescription className="flex flex-wrap items-center gap-2">
						<span>{errorMessage}</span>
						<Button
							variant="outline"
							size="sm"
							className="h-7 border-destructive/50 text-destructive hover:bg-destructive/10"
							onClick={() => refetchList()}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{isListLoading ? (
				<ResumeListSkeleton />
			) : documents.length === 0 && !isListError ? (
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
