import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ToggleThemeButton() {
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === "dark";
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
		>
			{isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
		</Button>
	);
}
