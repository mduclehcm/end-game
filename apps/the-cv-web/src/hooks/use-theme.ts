import { useAppStore } from "@/store/app-store";

export function useTheme() {
	const theme = useAppStore((s) => s.theme);
	const toggleTheme = useAppStore((s) => s.toggleTheme);
	return { theme, toggleTheme };
}
