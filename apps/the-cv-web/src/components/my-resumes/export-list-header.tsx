import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function ExportListHeader() {
	return (
		<div className="mb-8">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" className="shrink-0" asChild>
					<Link to="/my-resumes" aria-label="Back to My resumes">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold">My exports</h1>
					<p className="text-muted-foreground text-sm">
						PDF exports of your resumes. Download any time with a secure link.
					</p>
				</div>
			</div>
		</div>
	);
}
