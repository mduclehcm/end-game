import { type PropsWithChildren, type SyntheticEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateDocument } from "@/hooks/use-document-actions";

type CreateResumeDialogProps = PropsWithChildren;

export function CreateResumeDialog({ children }: CreateResumeDialogProps) {
	const [title, setTitle] = useState("");
	const [localOnly, setLocalOnly] = useState(false);
	const { createDocument, loading } = useCreateDocument();

	const handleSubmit = (e: SyntheticEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		createDocument({ title: trimmed, localOnly });
	};

	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new resume</DialogTitle>
					<DialogDescription>Give your resume a title to get started.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4">
					<div className="grid gap-2">
						<Label htmlFor="resume-title">Title</Label>
						<Input
							id="resume-title"
							placeholder="My Resume"
							maxLength={50}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							id="save-to-cloud"
							checked={!localOnly}
							onCheckedChange={(checked) => setLocalOnly(checked === true)}
						/>
						<Label htmlFor="local-only">Local only</Label>
					</div>
					<DialogFooter>
						<Button type="submit" disabled={!title.trim() || loading}>
							{loading ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
