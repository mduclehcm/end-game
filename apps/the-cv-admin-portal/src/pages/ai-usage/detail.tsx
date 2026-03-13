import type { LlmUsageLog } from "@algo/cv-core";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { Link, useLocation, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAiUsage } from "@/lib/api";

export default function AiUsageDetailPage() {
	const { id } = useParams<{ id: string }>();
	const location = useLocation();
	const stateItem = (location.state as { item?: LlmUsageLog } | null)?.item;

	// When opened from list we have state; otherwise try to find in recent data (e.g. from prompt filter)
	const { data: list } = useQuery({
		queryKey: ["ai-usage"],
		queryFn: () => fetchAiUsage(500, 0),
		enabled: !stateItem && !!id,
	});
	const item = stateItem ?? list?.find((r) => r.id === id);

	if (!id) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">AI Usage</h1>
				<p className="text-muted-foreground">Missing usage id.</p>
				<Link to="/ai-usage">
					<Button variant="outline">Back to list</Button>
				</Link>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">AI Usage detail</h1>
				<p className="text-muted-foreground">Usage not found. Open from the AI Usage list to view details.</p>
				<Link to="/ai-usage">
					<Button variant="outline">Back to list</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Link to={item.promptId ? `/ai-usage?promptId=${item.promptId}` : "/ai-usage"}>
						<Button variant="ghost" size="sm" aria-label="Back">
							← Back
						</Button>
					</Link>
					<span className="text-muted-foreground">·</span>
					<Badge variant="secondary">{item.type}</Badge>
					<span className="text-sm text-muted-foreground">{item.model}</span>
					{item.fieldKey && <span className="text-xs text-muted-foreground">· {item.fieldKey}</span>}
					{(item.promptId ?? item.promptUseCaseKey) && (
						<span className="text-xs text-muted-foreground">· prompt: {item.promptUseCaseKey ?? item.promptId}</span>
					)}
				</div>
			</div>
			<div className="rounded-lg border border-border bg-card p-4 text-sm">
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
	);
}
