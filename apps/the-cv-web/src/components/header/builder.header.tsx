import { BackButton } from "@/components/header/back-button";
import { ToggleDebugModeButton } from "@/components/header/toggle-debug-mode-button";
import { ToggleThemeButton } from "@/components/header/toggle-theme-button";
import { useBuilderStore } from "@/store";

export const BuilderHeader = () => {
	const title = useBuilderStore((state) => state.document?.title) ?? "New Resume";
	return (
		<div className="bg-card shadow-sm flex items-center justify-between p-2 z-999">
			<div className="flex gap-2 items-center">
				<BackButton />
				<h1>{title}</h1>
			</div>
			<div className="flex gap-2 items-center">
				<ToggleDebugModeButton />
				<ToggleThemeButton />
			</div>
		</div>
	);
};
