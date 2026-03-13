import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { activateSystemPrompt, deleteSystemPrompt, fetchSystemPrompt, updateSystemPrompt } from "@/lib/api";

export default function SystemPromptDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editing, setEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [editRole, setEditRole] = useState("");
	const [editGuide, setEditGuide] = useState("");

	const {
		data: prompt,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["system-prompt", id],
		queryFn: () => fetchSystemPrompt(id as string),
		enabled: !!id,
	});

	useEffect(() => {
		if (prompt) {
			setEditName(prompt.name);
			setEditRole(prompt.promptParts.role);
			setEditGuide(prompt.promptParts.guide);
		}
	}, [prompt]);

	const updateMutation = useMutation({
		mutationFn: ({
			id: promptId,
			payload,
		}: {
			id: string;
			payload: { name?: string; promptParts?: { role?: string; guide?: string } };
		}) => updateSystemPrompt(promptId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
			queryClient.invalidateQueries({ queryKey: ["system-prompt", id] });
			setEditing(false);
		},
	});

	const activateMutation = useMutation({
		mutationFn: activateSystemPrompt,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
			queryClient.invalidateQueries({ queryKey: ["system-prompt", id] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteSystemPrompt,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["system-prompts"] });
			navigate("/system-prompts", { replace: true });
		},
	});

	const handleSave = (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt) return;
		updateMutation.mutate({
			id: prompt.id,
			payload: {
				name: editName.trim(),
				promptParts: { role: editRole, guide: editGuide },
			},
		});
	};

	if (!id) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">System Prompts</h1>
				<p className="text-muted-foreground">Missing prompt id.</p>
				<Link to="/system-prompts">
					<Button variant="outline">Back to list</Button>
				</Link>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Prompt detail</h1>
				<p className="text-muted-foreground">Loading…</p>
			</div>
		);
	}

	if (error || !prompt) {
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold">Prompt detail</h1>
				<p className="text-destructive">
					{error ? `Failed to load: ${(error as Error).message}` : "Prompt not found."}
				</p>
				<Link to="/system-prompts">
					<Button variant="outline">Back to list</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Link to="/system-prompts">
					<Button variant="ghost" size="sm" aria-label="Back">
						← Back
					</Button>
				</Link>
			</div>
			<div className="rounded-lg border border-border bg-card p-4 text-sm">
				<h2 className="text-lg font-semibold mb-4">Prompt detail</h2>
				{!editing && (
					<dl className="space-y-4">
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">ID</dt>
							<dd className="font-mono text-xs">{prompt.id}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Use case</dt>
							<dd className="font-mono">{prompt.useCaseKey}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Name</dt>
							<dd>{prompt.name}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Active</dt>
							<dd>{prompt.isActive ? "Yes" : "No"}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</dt>
							<dd className="text-muted-foreground">{format(new Date(prompt.createdAt), "PPpp")}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Updated</dt>
							<dd className="text-muted-foreground">{format(new Date(prompt.updatedAt), "PPpp")}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Prompt text</dt>
							<dd className="whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-xs">{prompt.promptText}</dd>
						</div>
						<div>
							<dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
								Parts (role, guide)
							</dt>
							<dd className="space-y-2">
								<div>
									<span className="text-muted-foreground text-xs">Role:</span>
									<pre className="whitespace-pre-wrap rounded bg-muted/30 p-2 font-mono text-xs mt-0.5">
										{prompt.promptParts.role || "—"}
									</pre>
								</div>
								<div>
									<span className="text-muted-foreground text-xs">Guide:</span>
									<pre className="whitespace-pre-wrap rounded bg-muted/30 p-2 font-mono text-xs mt-0.5">
										{prompt.promptParts.guide || "—"}
									</pre>
								</div>
							</dd>
						</div>
					</dl>
				)}
				{editing && (
					<form onSubmit={handleSave} className="space-y-4">
						<div>
							<label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
								Name
							</label>
							<input
								type="text"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
							/>
						</div>
						<div>
							<label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
								Role
							</label>
							<textarea
								value={editRole}
								onChange={(e) => setEditRole(e.target.value)}
								rows={3}
								className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono"
							/>
						</div>
						<div>
							<label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
								Guide
							</label>
							<textarea
								value={editGuide}
								onChange={(e) => setEditGuide(e.target.value)}
								rows={5}
								className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono"
							/>
						</div>
						<div>
							<label className="text-xs font-medium uppercase tracking-wider text-muted-foreground block mb-1">
								Final prompt (preview)
							</label>
							<pre className="whitespace-pre-wrap rounded bg-muted/50 p-3 font-mono text-xs">
								{[editRole.trim(), editGuide.trim()].filter(Boolean).join("\n\n") || "—"}
							</pre>
						</div>
						<div className="flex gap-2">
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending ? "Saving…" : "Save"}
							</Button>
							<Button type="button" variant="ghost" onClick={() => setEditing(false)}>
								Cancel
							</Button>
						</div>
					</form>
				)}
				{!editing && (
					<div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								setEditing(true);
								setEditName(prompt.name);
								setEditRole(prompt.promptParts.role);
								setEditGuide(prompt.promptParts.guide);
							}}
						>
							Edit
						</Button>
						{!prompt.isActive && (
							<>
								<Button
									size="sm"
									variant="outline"
									onClick={() => activateMutation.mutate(prompt.id)}
									disabled={activateMutation.isPending}
								>
									Activate
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="text-destructive hover:text-destructive"
									onClick={() => {
										if (window.confirm(`Delete prompt "${prompt.name}"? This cannot be undone.`)) {
											deleteMutation.mutate(prompt.id);
										}
									}}
									disabled={deleteMutation.isPending}
								>
									{deleteMutation.isPending ? "Deleting…" : "Delete"}
								</Button>
							</>
						)}
						<Link to={`/ai-usage?promptId=${prompt.id}`}>
							<Button size="sm" variant="ghost" type="button">
								View requests
							</Button>
						</Link>
						{deleteMutation.isError && (
							<p className="w-full text-destructive text-sm mt-1">{(deleteMutation.error as Error).message}</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
