import { Spinner } from "@/components/ui/spinner";

export default function LoadingPage() {
	return (
		<div className="flex h-screen w-screen items-center justify-center">
			<div className="flex items-center gap-2">
				<Spinner />
				<p className="text-muted-foreground">Loading…</p>
			</div>
		</div>
	);
}
