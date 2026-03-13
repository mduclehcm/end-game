import type { SystemPromptDto } from "@algo/cv-core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activateSystemPrompt, createSystemPrompt, deleteSystemPrompt, fetchSystemPrompts } from "@/lib/api";

const USE_CASE_KEYS = [
	"parse-resume",
	"rewrite.summary.text",
	"rewrite.experience.description",
	"rewrite.education.description",
] as const;

type SystemPromptRow =
	| { id: string; kind: "empty"; useCaseKey: string }
	| { id: string; kind: "prompt"; useCaseKey: string; prompt: SystemPromptDto };

function groupByUseCase(prompts: SystemPromptDto[]): Map<string, SystemPromptDto[]> {
	const map = new Map<string, SystemPromptDto[]>();
	for (const p of prompts) {
		const list = map.get(p.useCaseKey) ?? [];
		list.push(p);
		map.set(p.useCaseKey, list);
	}
	for (const key of USE_CASE_KEYS) {
		if (!map.has(key)) map.set(key, []);
	}
	return map;
}

function flattenGroupedToRows(grouped: Map<string, SystemPromptDto[]>): SystemPromptRow[] {
	const rows: SystemPromptRow[] = [];
	for (const [useCaseKey] of Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b))) {
		const list = grouped.get(useCaseKey) ?? [];
		if (list.length === 0) {
			rows.push({ id: `empty-${useCaseKey}`, kind: "empty", useCaseKey });
		} else {
			for (const prompt of list) {
				rows.push({ id: prompt.id, kind: "prompt", useCaseKey, prompt });
			}
		}
	}
	return rows;
}

export default function SystemPromptsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const {
		data: prompts = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["system-prompts"],
		queryFn: () => fetchSystemPrompts(),
	});
	const createMutation = useMutation({
		mutationFn: createSystemPrompt,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-prompts"] }),
	});
	const activateMutation = useMutation({
		mutationFn: activateSystemPrompt,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
			queryClient.invalidateQueries({ queryKey: ["system-prompt"] });
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deleteSystemPrompt,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-prompts"] }),
	});

	const [createOpen, setCreateOpen] = useState(false);
	const [formUseCaseKey, setFormUseCaseKey] = useState<string>(USE_CASE_KEYS[0]);
	const [formName, setFormName] = useState("");
	const [formRole, setFormRole] = useState("");
	const [formGuide, setFormGuide] = useState("");

	const hasAnyPart = Boolean(formRole.trim() || formGuide.trim());

	const flatRows = useMemo(() => flattenGroupedToRows(groupByUseCase(prompts)), [prompts]);

	const columns = useMemo<ColumnDef<SystemPromptRow>[]>(
		() => [
			{
				accessorKey: "useCaseKey",
				header: "Use case",
				cell: ({ row }) => {
					const r = row.original;
					if (r.kind === "empty") return <span className="text-muted-foreground">{r.useCaseKey}</span>;
					return <span className="font-mono text-sm">{r.prompt.useCaseKey}</span>;
				},
			},
			{
				id: "name",
				header: "Name",
				cell: ({ row }) => {
					const r = row.original;
					if (r.kind === "empty")
						return <span className="text-muted-foreground text-sm">No prompts. Add one above.</span>;
					return r.prompt.name;
				},
			},
			{
				id: "active",
				header: "Active",
				cell: ({ row }) => {
					const r = row.original;
					if (r.kind === "empty") return null;
					return r.prompt.isActive ? "Yes" : "—";
				},
			},
			{
				id: "actions",
				header: () => <span className="text-right block">Actions</span>,
				cell: ({ row }) => {
					const r = row.original;
					if (r.kind === "empty") return null;
					const p = r.prompt;
					return (
						<div className="text-right">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="icon" variant="ghost" className="h-8 w-8">
										<MoreHorizontal className="h-4 w-4" />
										<span className="sr-only">Actions</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={() => navigate(`/system-prompts/${p.id}`)}>View detail</DropdownMenuItem>
									<DropdownMenuItem onClick={() => navigate(`/ai-usage?promptId=${p.id}`)}>
										View requests
									</DropdownMenuItem>
									{!p.isActive && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={(e) => {
													e.preventDefault();
													activateMutation.mutate(p.id);
												}}
												disabled={activateMutation.isPending}
											>
												Activate
											</DropdownMenuItem>
											<DropdownMenuItem
												variant="destructive"
												onClick={(e) => {
													e.preventDefault();
													if (window.confirm(`Delete prompt "${p.name}"? This cannot be undone.`)) {
														deleteMutation.mutate(p.id);
													}
												}}
												disabled={deleteMutation.isPending}
											>
												Delete
											</DropdownMenuItem>
										</>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[navigate, activateMutation, deleteMutation],
	);

	const table = useReactTable({
		data: flatRows,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const handleCreate = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formName.trim() || !hasAnyPart) return;
		createMutation.mutate(
			{
				useCaseKey: formUseCaseKey,
				name: formName.trim(),
				promptParts: {
					role: formRole.trim() || undefined,
					guide: formGuide.trim() || undefined,
				},
			},
			{
				onSuccess: () => {
					setFormName("");
					setFormRole("");
					setFormGuide("");
					setCreateOpen(false);
				},
			},
		);
	};

	if (error) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">System Prompts</h1>
				<p className="text-destructive">Failed to load: {(error as Error).message}</p>
				<Button variant="outline" onClick={() => refetch()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">System Prompts</h1>
				<Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
					Add prompt
				</Button>
			</div>

			{createOpen && (
				<form onSubmit={handleCreate} className="rounded-lg border border-border bg-card p-4 space-y-3 max-w-2xl">
					<h2 className="font-medium">New prompt</h2>
					<div>
						<label className="text-sm text-muted-foreground block mb-1">Use case</label>
						<select
							value={formUseCaseKey}
							onChange={(e) => setFormUseCaseKey(e.target.value)}
							className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
						>
							{USE_CASE_KEYS.map((k) => (
								<option key={k} value={k}>
									{k}
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="text-sm text-muted-foreground block mb-1">Name</label>
						<input
							type="text"
							value={formName}
							onChange={(e) => setFormName(e.target.value)}
							placeholder="e.g. Default parse"
							className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
					<div>
						<label className="text-sm text-muted-foreground block mb-1">Role</label>
						<textarea
							value={formRole}
							onChange={(e) => setFormRole(e.target.value)}
							placeholder="e.g. You are a resume parsing assistant."
							rows={2}
							className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono"
						/>
					</div>
					<div>
						<label className="text-sm text-muted-foreground block mb-1">Guide</label>
						<textarea
							value={formGuide}
							onChange={(e) => setFormGuide(e.target.value)}
							placeholder="Instructions and guidelines..."
							rows={3}
							className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono"
						/>
					</div>
					<p className="text-xs text-muted-foreground">
						Final prompt = Role + Guide (concatenated with double newline). Output structure is defined by the backend
						per use case.
					</p>
					<div className="flex gap-2">
						<Button type="submit" disabled={createMutation.isPending || !formName.trim() || !hasAnyPart}>
							{createMutation.isPending ? "Creating…" : "Create"}
						</Button>
						<Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
							Cancel
						</Button>
					</div>
				</form>
			)}

			<div className="rounded-md border border-border">
				{deleteMutation.isError && (
					<p className="p-3 text-destructive text-sm bg-destructive/10">{(deleteMutation.error as Error).message}</p>
				)}
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className={header.id === "actions" ? "text-right" : undefined}>
										{flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className="text-center text-muted-foreground py-8">
									Loading…
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => {
								const r = row.original;
								if (r.kind === "empty") {
									return (
										<TableRow key={row.id}>
											<TableCell className="text-muted-foreground">{r.useCaseKey}</TableCell>
											<TableCell colSpan={3} className="text-muted-foreground text-sm">
												No prompts. Add one above.
											</TableCell>
										</TableRow>
									);
								}
								return (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cell.column.id === "actions" ? "text-right space-x-2" : undefined}
											>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
