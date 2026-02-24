import { useBuilderStore } from "@/store/builder-store";

export function useDebugger() {
	const debugMode = useBuilderStore((s) => s.debugMode);
	const toggleDebugMode = useBuilderStore((s) => s.toggleDebugMode);

	return [debugMode, toggleDebugMode] as const;
}
