import { FileDown, Plus } from "lucide-react";
import { CreateResumeDialog } from "@/components/my-resumes/create-resume-dialog";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/nav-link";

export function ResumeListHeader() {
	return (
		<div className="mb-8">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h1 className="text-2xl font-bold">My resumes</h1>
					<p className="text-muted-foreground">Manage and edit your saved resumes.</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<NavLink to="/my-resumes/exports" className="gap-1.5">
							<FileDown className="size-4" />
							Exports
						</NavLink>
					</Button>
					<CreateResumeDialog>
						<Button>
							<Plus className="size-4" />
							New resume
						</Button>
					</CreateResumeDialog>
				</div>
			</div>
		</div>
	);
}
