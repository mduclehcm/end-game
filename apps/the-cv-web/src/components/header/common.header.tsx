import { NavLink } from "@/components/nav-link";
import { ToggleThemeButton } from "./toggle-theme-button";

export function PageHeader() {
	return (
		<header className="bg-card">
			<div className="max-w-[1600px] mx-auto flex h-14 items-center justify-between px-4">
				<NavLink to="/" className="font-semibold">
					The Resume
				</NavLink>
				<ToggleThemeButton />
			</div>
		</header>
	);
}
