import type { LlmUsageLog } from "@algo/cv-core";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fetchAiUsage } from "@/lib/api";

const columns: ColumnDef<LlmUsageLog>[] = [
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
	},
	{
		accessorKey: "model",
		header: "Model",
		cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.model}</span>,
	},
	{
		accessorKey: "fieldKey",
		header: "Field",
		cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.fieldKey ?? "—"}</span>,
	},
	{
		id: "tokens",
		header: "Tokens",
		cell: ({ row }) => (
			<span className="text-muted-foreground text-xs">{row.original.inputTokens + row.original.outputTokens}</span>
		),
	},
	{
		accessorKey: "durationMs",
		header: "Duration",
		cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.durationMs} ms</span>,
	},
	{
		accessorKey: "createdAt",
		header: "Time",
		cell: ({ row }) => (
			<span className="text-muted-foreground text-xs">
				{formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
			</span>
		),
	},
];

export default function AiUsagePage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const openDetail = useCallback(
		(row: LlmUsageLog) => {
			navigate(`/ai-usage/${row.id}`, { state: { item: row } });
		},
		[navigate],
	);
	const promptId = searchParams.get("promptId") ?? undefined;
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["ai-usage", promptId],
		queryFn: () => fetchAiUsage(100, 0, promptId),
	});

	const table = useReactTable({
		data: data ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	if (error) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">AI Usage</h1>
				<p className="text-destructive">Failed to load: {(error as Error).message}</p>
				<Button variant="outline" onClick={() => refetch()}>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold">AI Usage</h1>
					{promptId && <span className="text-sm text-muted-foreground">Filtered by prompt</span>}
					<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
						{isLoading ? "Loading…" : "Refresh"}
					</Button>
				</div>
				<div className="rounded-md border border-border">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
										Loading…
									</TableCell>
								</TableRow>
							) : !data?.length ? (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
										No LLM requests yet.
									</TableCell>
								</TableRow>
							) : (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => openDetail(row.original)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
										))}
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</TooltipProvider>
	);
}
