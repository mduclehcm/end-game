import { type DocumentInfo, DocumentSource } from "@algo/cv-core";
import { Cloud, HardDrive, MoreHorizontal, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteDocument } from "@/hooks/use-document-actions";

type ResumeCardProps = {
	resume: DocumentInfo;
};

export function ResumeCard({ resume }: ResumeCardProps) {
	const navigate = useNavigate();
	const [confirmDelete, setConfirmDelete] = useState(false);
	const { deleteDocument, loading } = useDeleteDocument();

	const onSelect = useCallback(() => {
		navigate(resume.source === DocumentSource.Cloud ? `/c/${resume.id}` : `/r/${resume.id}`, {
			state: { internal: true },
		});
	}, [navigate, resume.id, resume.source]);

	const onDeleteClick = useCallback(() => {
		setConfirmDelete(true);
	}, []);

	const handleConfirm = useCallback(() => {
		deleteDocument({
			id: resume.id,
			isCloudDocument: resume.source === DocumentSource.Cloud,
			onSuccess: () => setConfirmDelete(false),
		});
	}, [deleteDocument, resume.id, resume.source]);

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
						{resume.source !== DocumentSource.Cloud && (
							<Tooltip>
								<TooltipTrigger asChild>
									<HardDrive className="size-5 text-muted-foreground" aria-label="Local document" />
								</TooltipTrigger>
								<TooltipContent>Document is saved locally</TooltipContent>
							</Tooltip>
						)}
						{resume.source === DocumentSource.Cloud && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Cloud className="size-5 text-muted-foreground" aria-label="Cloud document" />
								</TooltipTrigger>
								<TooltipContent>Document is saved in the cloud</TooltipContent>
							</Tooltip>
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="size-8" onClick={(e) => e.stopPropagation()}>
									<MoreHorizontal className="size-4" />
									<span className="sr-only">Actions</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
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
