import type { LlmUsageLog } from "@algo/cv-core";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchAiUsage } from "@/lib/api";
import { truncate } from "@/lib/truncate";

const INPUT_OUTPUT_MAX = 80;

function TruncatedCell({ text, title }: { text: string; title?: string }) {
	const short = truncate(text, INPUT_OUTPUT_MAX);
	const isLong = text.length > INPUT_OUTPUT_MAX;
	if (!isLong) {
		return <span className="block max-w-[200px]">{text || "—"}</span>;
	}
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="block max-w-[200px] cursor-default underline decoration-dotted">{short}</span>
			</TooltipTrigger>
			<TooltipContent side="left" className="max-w-md whitespace-pre-wrap wrap-break-word">
				{title ? `${title}\n\n${text}` : text}
			</TooltipContent>
		</Tooltip>
	);
}

function DetailDialog({ item, onClose }: { item: LlmUsageLog; onClose: () => void }) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const d = dialogRef.current;
		if (!d) return;
		d.showModal();
		return () => d.close();
	}, []);

	const close = useCallback(() => {
		dialogRef.current?.close();
		onClose();
	}, [onClose]);

	return (
		<dialog
			ref={dialogRef}
			onCancel={close}
			onClick={(e) => e.target === dialogRef.current && close()}
			className="fixed inset-0 z-50 max-h-[90vh] w-full max-w-2xl rounded-lg border border-border bg-background p-0 shadow-lg backdrop:bg-black/50"
		>
			<div className="flex max-h-[90vh] flex-col">
				<div className="flex items-center justify-between border-b border-border px-4 py-3">
					<div className="flex items-center gap-2">
						<Badge variant="secondary">{item.type}</Badge>
						<span className="text-sm text-muted-foreground">{item.model}</span>
						{item.fieldKey && <span className="text-xs text-muted-foreground">· {item.fieldKey}</span>}
					</div>
					<Button variant="ghost" size="sm" onClick={close} aria-label="Close">
						×
					</Button>
				</div>
				<div className="flex-1 overflow-y-auto px-4 py-3 text-sm">
					<dl className="space-y-4">
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</dt>
							<dd>
								{format(new Date(item.createdAt), "PPpp")} (
								{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })})
							</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Tokens · Duration
							</dt>
							<dd className="text-muted-foreground">
								{item.inputTokens} in + {item.outputTokens} out ({item.inputTokens + item.outputTokens} total) ·{" "}
								{item.durationMs} ms
							</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">System prompt</dt>
							<dd className="whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-3 font-mono text-xs">
								{item.systemPrompt ?? "—"}
							</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">User input</dt>
							<dd className="whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-3 font-mono text-xs">
								{item.userInput ?? "—"}
							</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Output</dt>
							<dd className="whitespace-pre-wrap wrap-break-word rounded bg-muted/50 p-3 font-mono text-xs">
								{item.output ?? "—"}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</dialog>
	);
}

export default function AiUsagePage() {
	const [selected, setSelected] = useState<LlmUsageLog | null>(null);
	const openDetail = useCallback((row: LlmUsageLog) => setSelected(row), []);
	const closeDetail = useCallback(() => setSelected(null), []);
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["ai-usage"],
		queryFn: () => fetchAiUsage(100, 0),
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
					<Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
						{isLoading ? "Loading…" : "Refresh"}
					</Button>
				</div>
				<div className="rounded-md border border-border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Type</TableHead>
								<TableHead>Model</TableHead>
								<TableHead>Field</TableHead>
								<TableHead>Input</TableHead>
								<TableHead>Output</TableHead>
								<TableHead>Tokens</TableHead>
								<TableHead>Duration</TableHead>
								<TableHead>Time</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
										Loading…
									</TableCell>
								</TableRow>
							) : !data?.length ? (
								<TableRow>
									<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
										No LLM requests yet.
									</TableCell>
								</TableRow>
							) : (
								data.map((row: LlmUsageLog) => (
									<TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(row)}>
										<TableCell>
											<Badge variant="secondary">{row.type}</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">{row.model}</TableCell>
										<TableCell className="text-muted-foreground text-xs">{row.fieldKey ?? "—"}</TableCell>
										<TableCell className="text-xs">
											<TruncatedCell text={row.userInput} title="User input" />
										</TableCell>
										<TableCell className="text-xs">
											<TruncatedCell text={row.output} title="Output" />
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{row.inputTokens + row.outputTokens}
										</TableCell>
										<TableCell className="text-muted-foreground text-xs">{row.durationMs} ms</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
				{selected && <DetailDialog item={selected} onClose={closeDetail} />}
			</div>
		</TooltipProvider>
	);
}
