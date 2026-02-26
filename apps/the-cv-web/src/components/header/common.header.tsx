import { NavLink } from "@/components/nav-link";
import { ToggleThemeButton } from "./toggle-theme-button";

export function PageHeader() {
	return (
		<header className="bg-card p-3">
			<div className="container mx-auto flex items-center justify-between px-4">
				<NavLink to="/" className="font-semibold">
					The Resume
				</NavLink>
				<ToggleThemeButton />
			</div>
		</header>
	);
}
