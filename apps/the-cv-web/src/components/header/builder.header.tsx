import { BackButton } from "@/components/header/back-button";
import { SaveIndicator } from "@/components/header/save-indicator";
import { ToggleDebugModeButton } from "@/components/header/toggle-debug-mode-button";
import { ToggleThemeButton } from "@/components/header/toggle-theme-button";
import { useBuilderStore } from "@/store";

export const BuilderHeader = () => {
	const title = useBuilderStore((state) => state.title);
	return (
		<div className="bg-card border-b flex items-center justify-between p-3 px-3 z-999">
			<div className="flex gap-2 items-center">
				<BackButton />
				<h1>{title}</h1>
				<SaveIndicator />
			</div>
			<div className="flex gap-2 items-center">
				<ToggleDebugModeButton />
				<ToggleThemeButton />
			</div>
		</div>
	);
};
