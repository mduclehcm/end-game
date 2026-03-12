import { LogOutIcon } from "lucide-react";
import { NavLink } from "@/components/nav-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth-store";
import { ToggleThemeButton } from "./toggle-theme-button";

function initials(displayName: string, email: string): string {
	if (displayName?.trim()) {
		const parts = displayName.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
		}
		return displayName.slice(0, 2).toUpperCase();
	}
	if (email) {
		return email.slice(0, 2).toUpperCase();
	}
	return "?";
}

export function PageHeader() {
	const { isAuthenticated, user, logout } = useAuthStore();

	return (
		<header className="bg-card p-3">
			<div className="container mx-auto flex items-center justify-between px-4">
				<NavLink to="/" className="font-semibold">
					The Resume
				</NavLink>
				<div className="flex items-center gap-2">
					{isAuthenticated && user ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="rounded-full">
									<Avatar size="sm">
										{user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.displayName} /> : null}
										<AvatarFallback>{initials(user.displayName, user.email)}</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<div className="flex flex-col">
										<span className="font-medium">{user.displayName || user.email}</span>
										{user.displayName && (
											<span className="text-muted-foreground text-xs font-normal">{user.email}</span>
										)}
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive" onSelect={() => logout()}>
									<LogOutIcon />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button variant="outline" size="sm" asChild>
							<NavLink to="/sign-in">Sign in</NavLink>
						</Button>
					)}
					<ToggleThemeButton />
				</div>
			</div>
		</header>
	);
}
