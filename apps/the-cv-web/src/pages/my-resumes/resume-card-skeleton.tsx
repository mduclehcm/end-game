import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ResumeCardSkeleton() {
	return (
		<Card className="transition-shadow hover:shadow-md">
			<CardHeader>
				<Skeleton className="h-6 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</CardHeader>
		</Card>
	);
}
