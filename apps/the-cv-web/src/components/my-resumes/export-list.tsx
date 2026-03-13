import type { ExportInfo } from "@algo/cv-core";
import { AlertCircle, Download, FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RelativeTime } from "@/components/relative-time";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExportList } from "@/hooks/use-export-queries";
import { createExportDownloadLink } from "@/lib/api";

function ExportRow({ item }: { item: ExportInfo }) {
	const navigate = useNavigate();
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleDownload = useCallback(async () => {
		setError(null);
		setDownloading(true);
		try {
			const { downloadUrl } = await createExportDownloadLink(item.id);
			window.open(downloadUrl, "_blank", "noopener,noreferrer");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Download failed");
		} finally {
			setDownloading(false);
		}
	}, [item.id]);

	const statusVariant = item.status === "ready" ? "default" : item.status === "failed" ? "destructive" : "secondary";
	const fileName = item.fileName ?? "resume.pdf";
	const sizeStr = item.sizeBytes != null ? `${(item.sizeBytes / 1024).toFixed(1)} KB` : null;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<FileText className="size-5 shrink-0 text-muted-foreground" />
					<div className="min-w-0 flex-1">
						<CardTitle className="truncate text-base">{fileName}</CardTitle>
						<CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
							<RelativeTime date={item.createdAt} />
							{sizeStr != null && <span>· {sizeStr}</span>}
							{item.status === "failed" && item.errorMessage && (
								<span className="text-destructive">{item.errorMessage}</span>
							)}
						</CardDescription>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Badge variant={statusVariant}>{item.status}</Badge>
					{item.status === "ready" && (
						<Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="gap-1.5">
							<Download className="size-3.5" />
							{downloading ? "Opening…" : "Download"}
						</Button>
					)}
					{item.status !== "ready" && item.status !== "failed" && (
						<Button variant="ghost" size="sm" onClick={() => navigate(`/doc/${item.documentId}`)}>
							View resume
						</Button>
					)}
				</div>
			</CardHeader>
			{error && (
				<div className="px-6 pb-3">
					<Alert variant="destructive" className="py-2">
						<AlertCircle className="size-4" />
						<AlertTitle>Download failed</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				</div>
			)}
		</Card>
	);
}

const SKELETON_KEYS = ["export-skeleton-a", "export-skeleton-b", "export-skeleton-c", "export-skeleton-d"] as const;

function ExportListSkeleton() {
	return (
		<div className="space-y-3">
			{SKELETON_KEYS.map((key) => (
				<Card key={key}>
					<CardHeader className="flex flex-row items-center justify-between gap-4">
						<div className="flex flex-1 items-center gap-3">
							<Skeleton className="size-5 shrink-0 rounded" />
							<div className="flex-1 space-y-2">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-3 w-32" />
							</div>
						</div>
						<Skeleton className="h-5 w-16 rounded-full" />
					</CardHeader>
				</Card>
			))}
		</div>
	);
}

export function ExportList() {
	const { exports: list, isLoading, isError, error, refetch } = useExportList();
	const errorMessage = error instanceof Error ? error.message : "Failed to load exports.";

	if (isError) {
		return (
			<Alert variant="destructive" className="py-3">
				<AlertCircle className="size-4" />
				<AlertTitle>Could not load exports</AlertTitle>
				<AlertDescription className="flex flex-wrap items-center gap-2">
					<span>{errorMessage}</span>
					<Button
						variant="outline"
						size="sm"
						className="h-7 border-destructive/50 text-destructive hover:bg-destructive/10"
						onClick={() => refetch()}
					>
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (isLoading) {
		return <ExportListSkeleton />;
	}

	if (list.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground border border-dashed rounded-lg">
				No exports yet. Export a resume as PDF from the editor or from a resume card, then come back here to download.
			</p>
		);
	}

	return (
		<section className="space-y-3">
			{list.map((item) => (
				<ExportRow key={item.id} item={item} />
			))}
		</section>
	);
}
