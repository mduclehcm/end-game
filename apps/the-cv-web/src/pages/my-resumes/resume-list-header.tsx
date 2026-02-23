import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResumeListHeaderProps = {
	onCreateClick: () => void;
	isCreating: boolean;
};

export function ResumeListHeader({ onCreateClick, isCreating }: ResumeListHeaderProps) {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h1 className="text-2xl font-bold">My resumes</h1>
					<p className="text-muted-foreground">Manage and edit your saved resumes.</p>
				</div>
				<Button size="sm" onClick={onCreateClick} disabled={isCreating}>
					{isCreating ? "Creating…" : "New resume"}
					<Plus className="size-4" />
				</Button>
			</div>
		</div>
	);
}
