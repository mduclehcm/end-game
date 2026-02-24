import { Bug, BugOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebugger } from "@/hooks/use-debug-mode";

export function ToggleDebugModeButton() {
	const [debugMode, toggleDebugMode] = useDebugger();
	return (
		<Button type="button" variant="ghost" size="icon" onClick={toggleDebugMode} aria-label="Toggle debug mode">
			{debugMode ? <Bug className="size-5" /> : <BugOff className="size-5" />}
		</Button>
	);
}
