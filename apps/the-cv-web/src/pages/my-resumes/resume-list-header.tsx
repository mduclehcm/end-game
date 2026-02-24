import { Plus } from "lucide-react";
import { CreateResumeDialog } from "@/components/my-resumes/create-resume-dialog";
import { Button } from "@/components/ui/button";

export function ResumeListHeader() {
	return (
		<div className="mb-8">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h1 className="text-2xl font-bold">My resumes</h1>
					<p className="text-muted-foreground">Manage and edit your saved resumes.</p>
				</div>
				<CreateResumeDialog>
					<Button size="sm">
						<Plus className="size-4" />
						New resume
					</Button>
				</CreateResumeDialog>
			</div>
		</div>
	);
}
