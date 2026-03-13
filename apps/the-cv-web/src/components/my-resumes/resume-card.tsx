import type { DocumentInfo } from "@algo/cv-core";
import type React from "react";
import { FileDown, MoreHorizontal, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createExport } from "@/lib/api";
import { RelativeTime } from "@/components/relative-time";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteDocument } from "@/hooks/use-document-actions";

type ResumeCardProps = {
	resume: DocumentInfo;
};

export function ResumeCard({ resume }: ResumeCardProps) {
	const navigate = useNavigate();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [exporting, setExporting] = useState(false);
	const { deleteDocument, loading } = useDeleteDocument();

	const onSelect = useCallback(() => {
		navigate(`/doc/${resume.id}`, { state: { internal: true } });
	}, [navigate, resume.id]);

	const onExportPdf = useCallback(async (e: React.MouseEvent) => {
		e.stopPropagation();
		setExporting(true);
		try {
			await createExport(resume.id);
			toast.success("Export started", {
				description: "Go to My exports to download your PDF when it's ready.",
				action: {
					label: "Open exports",
					onClick: () => navigate("/my-resumes/exports"),
				},
			});
		} catch (err) {
			toast.error("Export failed", {
				description: err instanceof Error ? err.message : "Could not start export",
			});
		} finally {
			setExporting(false);
		}
	}, [resume.id, navigate]);

	const onDeleteClick = useCallback(() => {
		setConfirmDelete(true);
	}, []);

	const handleConfirm = useCallback(() => {
		deleteDocument({
			id: resume.id,
			onSuccess: () => setConfirmDelete(false),
		});
	}, [deleteDocument, resume.id]);

	return (
		<>
			<Card
				role="button"
				tabIndex={0}
				className="transition-shadow hover:shadow-md cursor-pointer"
				onClick={onSelect}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onSelect();
					}
				}}
			>
				<CardHeader className="flex flex-row items-start justify-between gap-2">
					<div className="space-y-1.5 min-w-0 flex-1">
						<CardTitle className="line-clamp-1">{resume.title}</CardTitle>
						<CardDescription>
							Updated <RelativeTime date={resume.updatedAt} />
						</CardDescription>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="size-8" onClick={(e) => e.stopPropagation()}>
									<MoreHorizontal className="size-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={onExportPdf}
									disabled={exporting}
								>
									<FileDown className="size-3.5 mr-2" />
									{exporting ? "Exporting…" : "Export PDF"}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={(e) => {
										e.stopPropagation();
										onDeleteClick();
									}}
								>
									<Trash2 className="size-3.5 mr-2" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>
			</Card>
			<AlertDialog open={confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(false)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete resume</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete &quot;{resume?.title}
							&quot;? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={loading}>
							{loading ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
