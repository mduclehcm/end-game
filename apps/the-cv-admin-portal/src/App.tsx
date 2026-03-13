import { Activity, FileText } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
	Sidebar,
	SidebarContent,
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

const nav = [
	{ path: "/", label: "AI Usage", icon: Activity },
	{ path: "/system-prompts", label: "System Prompts", icon: FileText },
];

export default function App() {
	const location = useLocation();

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
										<SidebarMenuButton asChild isActive={location.pathname === path} tooltip={label}>
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
