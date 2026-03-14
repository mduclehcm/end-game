import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Shield, ShieldOff } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type AdminUser, changeUserRole, fetchUsers } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function UsersPage() {
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const currentUser = useAuthStore((s) => s.user);
	const queryClient = useQueryClient();
	const limit = 20;

	const { data, isLoading } = useQuery({
		queryKey: ["admin-users", search, page],
		queryFn: () => fetchUsers({ limit, offset: page * limit, search: search || undefined }),
	});

	const [roleDialog, setRoleDialog] = useState<{ user: AdminUser; newRole: string } | null>(null);

	const mutation = useMutation({
		mutationFn: ({ userId, role }: { userId: string; role: string }) => changeUserRole(userId, role),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			setRoleDialog(null);
		},
	});

	function handleRoleToggle(user: AdminUser) {
		const newRole = user.role === "admin" ? "user" : "admin";
		setRoleDialog({ user, newRole });
	}

	const users = data?.data ?? [];
	const total = data?.total ?? 0;
	const totalPages = Math.ceil(total / limit);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Users</h1>
				<span className="text-sm text-muted-foreground">{total} total</span>
			</div>

			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Search by email or name..."
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setPage(0);
					}}
					className="pl-10"
				/>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
									Loading...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground py-8">
									No users found
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="font-medium">{user.displayName || "—"}</div>
										{user.username && (
											<div className="text-sm text-muted-foreground">@{user.username}</div>
										)}
									</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										<Badge variant={user.role === "admin" ? "default" : "secondary"}>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{format(new Date(user.createdAt), "MMM d, yyyy")}
									</TableCell>
									<TableCell>
										{currentUser?.id !== user.id && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRoleToggle(user)}
												title={user.role === "admin" ? "Remove admin" : "Make admin"}
											>
												{user.role === "admin" ? (
													<ShieldOff className="h-4 w-4" />
												) : (
													<Shield className="h-4 w-4" />
												)}
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2">
					<Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
						Previous
					</Button>
					<span className="text-sm text-muted-foreground">
						Page {page + 1} of {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages - 1}
						onClick={() => setPage((p) => p + 1)}
					>
						Next
					</Button>
				</div>
			)}

			<Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
				{roleDialog && (
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Change User Role</DialogTitle>
							<DialogDescription>
								{roleDialog.newRole === "admin"
									? `Grant admin privileges to ${roleDialog.user.email}?`
									: `Remove admin privileges from ${roleDialog.user.email}?`}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setRoleDialog(null)}>
								Cancel
							</Button>
							<Button
								variant={roleDialog.newRole === "admin" ? "default" : "destructive"}
								disabled={mutation.isPending}
								onClick={() =>
									mutation.mutate({
										userId: roleDialog.user.id,
										role: roleDialog.newRole,
									})
								}
							>
								{mutation.isPending
									? "Updating..."
									: roleDialog.newRole === "admin"
										? "Grant Admin"
										: "Remove Admin"}
							</Button>
						</DialogFooter>
					</DialogContent>
				)}
			</Dialog>
		</div>
	);
}
