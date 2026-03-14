import { Activity, FileText, LogOut, Users } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/auth-store";

const nav = [
	{ path: "/ai-usage", label: "AI Usage", icon: Activity },
	{ path: "/system-prompts", label: "System Prompts", icon: FileText },
	{ path: "/users", label: "Users", icon: Users },
];

export default function App() {
	const location = useLocation();
	const navigate = useNavigate();
	const { user, logout } = useAuthStore();

	async function handleLogout() {
		await logout();
		navigate("/login", { replace: true });
	}

	return (
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<span className="px-2 font-semibold text-sidebar-foreground">CV Admin</span>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								{nav.map(({ path, label, icon: Icon }) => (
									<SidebarMenuItem key={path}>
										<SidebarMenuButton
											asChild
											isActive={location.pathname.startsWith(path)}
											tooltip={label}
										>
											<Link to={path}>
												<Icon className="size-4" />
												<span>{label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<div className="flex items-center gap-2 px-2 py-1">
						<div className="flex-1 min-w-0">
							<div className="text-sm font-medium truncate">{user?.displayName || user?.email}</div>
							<div className="text-xs text-muted-foreground truncate">{user?.email}</div>
						</div>
						<Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
							<LogOut className="h-4 w-4" />
						</Button>
					</div>
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>
				<header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
					<SidebarTrigger />
					<span className="text-sm font-medium text-muted-foreground">CV Admin Portal</span>
				</header>
				<div className="flex-1 p-6 overflow-auto">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
