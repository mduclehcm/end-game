import { Activity } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const nav = [{ path: "/", label: "AI Usage", icon: Activity }];

export default function App() {
	const location = useLocation();

	return (
		<div className="min-h-screen flex">
			<aside className="w-56 border-r border-border bg-card p-4">
				<h1 className="text-lg font-semibold text-foreground mb-6">CV Admin</h1>
				<nav className="flex flex-col gap-1">
					{nav.map(({ path, label, icon: Icon }) => (
						<Link
							key={path}
							to={path}
							className={cn(
								"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								location.pathname === path
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<Icon className="size-4" />
							{label}
						</Link>
					))}
				</nav>
			</aside>
			<main className="flex-1 p-6 overflow-auto">
				<Outlet />
			</main>
		</div>
	);
}
