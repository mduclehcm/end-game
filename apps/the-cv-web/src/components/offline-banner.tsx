import { Circle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cn } from "@/lib/utils";

export function OfflineBanner() {
	const { isOnline, syncFailed } = useOnlineStatus();

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span
					role="img"
					className={cn(
						"inline-flex shrink-0",
						isOnline && !syncFailed && "text-green-600 dark:text-green-500",
						!isOnline && "text-amber-600 dark:text-amber-500",
						syncFailed && "text-destructive",
					)}
					aria-label={syncFailed ? "Sync failed" : isOnline ? "Online" : "Offline"}
				>
					<Circle className="size-2 fill-current" />
				</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{syncFailed
					? "Sync failed. We'll retry when you're back online."
					: isOnline
						? "Online"
						: "Offline. Edits are saved locally and will sync when you're back online."}
			</TooltipContent>
		</Tooltip>
	);
}
