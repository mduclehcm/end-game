import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { rewriteCloudField } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store";

type BuilderRichTextInputProps = {
	className?: string;
	name: string;
	label: string;
	placeholder?: string;
	field: string;
	/** Document path for this field (e.g. content.summary.text). When set, focus will set active field in preview. */
	dataKey?: string;
	/** Context for AI rewrite: section/id, entity id, section kind, field key. When set, AI review button is shown for cloud docs. */
	rewriteContext?: {
		sectionId: string;
		entityId: string;
		sectionKind: string;
		fieldKey: string;
	};
};

export function BuilderRichTextInput({
	className,
	name,
	label,
	placeholder = "Start writing…",
	field,
	dataKey,
	rewriteContext,
}: BuilderRichTextInputProps) {
	const value = useBuilderStore((state) => state.data.fieldValues[field] ?? "");
	const setValue = useBuilderStore((state) => state.setFieldValue);
	const setActiveField = useBuilderStore((state) => state.setActiveField);
	const activeField = useBuilderStore((state) => state.activeField);
	const documentId = useBuilderStore((state) => state.documentId);
	const { isOnline } = useOnlineStatus();
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [rewriteLoading, setRewriteLoading] = useState(false);
	const [rewriteError, setRewriteError] = useState<string | null>(null);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				paragraph: { HTMLAttributes: { class: "mb-2 last:mb-0" } },
			}),
			Placeholder.configure({ placeholder }),
		],
		content: value || "",
		editorProps: {
			attributes: {
				class:
					"min-h-[120px] w-full bg-input/20 px-3 py-2 text-sm outline-none focus-visible:ring-inset focus-visible:ring-ring/30 dark:bg-input/30 [&_p]:mb-2 [&_p:last-child]:mb-0",
			},
			handleDOMEvents: {
				focus: () => {
					if (dataKey != null) setActiveField(dataKey);
				},
			},
		},
	});

	const onUpdate = useCallback(
		({ editor: ed }: { editor: Editor }) => {
			const html = ed.getHTML();
			setValue(field, html === "<p></p>" ? "" : html);
		},
		[field, setValue],
	);

	useEffect(() => {
		if (!editor) return;
		editor.on("update", onUpdate);
		return () => {
			editor.off("update", onUpdate);
		};
	}, [editor, onUpdate]);

	// Sync external value into editor when it changes (e.g. load another document)
	useEffect(() => {
		if (!editor) return;
		const current = editor.getHTML();
		const normalized = value || "<p></p>";
		if (current !== normalized) {
			editor.commands.setContent(normalized, { emitUpdate: false });
		}
	}, [editor, value]);

	// When preview sets activeField to this field, scroll into view and focus (e.g. click on preview element)
	useEffect(() => {
		if (dataKey == null || activeField !== dataKey || !editor) return;
		const wrapper = wrapperRef.current;
		if (!wrapper) return;
		if (wrapper.contains(document.activeElement)) return; // Already focused from data editor
		wrapper.scrollIntoView({ block: "nearest", behavior: "smooth" });
		requestAnimationFrame(() => editor.commands.focus());
	}, [dataKey, activeField, editor]);

	// Re-render toolbar when selection/content changes so active states stay in sync
	const [, setToolbarTick] = useState(0);
	useEffect(() => {
		if (!editor) return;
		const update = () => setToolbarTick((t) => t + 1);
		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
		};
	}, [editor]);

	const handleAiReview = useCallback(async () => {
		if (!documentId || !isOnline || !rewriteContext || !value?.trim()) return;
		setRewriteError(null);
		setRewriteLoading(true);
		try {
			const result = await rewriteCloudField(documentId, {
				sectionId: rewriteContext.sectionId,
				entityId: rewriteContext.entityId,
				fieldId: field,
				sectionKind: rewriteContext.sectionKind,
				fieldKey: rewriteContext.fieldKey,
				apply: false,
			});
			const newValue = "value" in result ? result.value : "";
			if (newValue) {
				setValue(field, newValue);
				editor?.commands.setContent(newValue, { emitUpdate: false });
			}
		} catch (err) {
			// #region agent log
			fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c6e154" },
				body: JSON.stringify({
					sessionId: "c6e154",
					location: "rich-text-field.tsx:handleAiReview",
					message: "handleAiReview catch",
					data: { errMessage: err instanceof Error ? err.message : String(err) },
					timestamp: Date.now(),
					hypothesisId: "H4",
				}),
			}).catch(() => {});
			// #endregion
			setRewriteError(err instanceof Error ? err.message : "AI review failed");
		} finally {
			setRewriteLoading(false);
		}
	}, [documentId, isOnline, rewriteContext, value, field, setValue, editor]);

	const canShowAi = documentId && rewriteContext != null && (value == null || String(value).trim() !== "");
	const showAiReview = canShowAi && isOnline;
	const showAiDisabled = canShowAi && !isOnline;

	return (
		<div ref={wrapperRef} data-data-key={dataKey ?? undefined}>
			<Field className={cn("flex flex-col gap-2", className)}>
				<FieldLabel htmlFor={name}>{label}</FieldLabel>
				<div className="overflow-hidden rounded-md border border-input">
					{editor && (
						<div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/50 p-1">
							<ToolbarButton
								editor={editor}
								onClick={() => editor.chain().focus().toggleBold().run()}
								active={editor.isActive("bold")}
								title="Bold"
								icon={<BoldIcon />}
							/>
							<ToolbarButton
								editor={editor}
								onClick={() => editor.chain().focus().toggleItalic().run()}
								active={editor.isActive("italic")}
								title="Italic"
								icon={<ItalicIcon />}
							/>
							<ToolbarButton
								editor={editor}
								onClick={() => editor.chain().focus().toggleBulletList().run()}
								active={editor.isActive("bulletList")}
								title="Bullet list"
								icon={<ListIcon />}
							/>
							<ToolbarButton
								editor={editor}
								onClick={() => editor.chain().focus().toggleOrderedList().run()}
								active={editor.isActive("orderedList")}
								title="Numbered list"
								icon={<ListOrderedIcon />}
							/>
							{showAiReview && (
								<ToolbarButton
									editor={editor}
									onClick={handleAiReview}
									active={false}
									disabled={rewriteLoading}
									title={rewriteError ?? "AI review"}
									icon={
										rewriteLoading ? (
											<span className="size-4 animate-pulse rounded bg-muted-foreground/50" />
										) : (
											<SparklesIcon />
										)
									}
								/>
							)}
							{showAiDisabled && (
								<ToolbarButton
									editor={editor}
									onClick={() => {}}
									active={false}
									disabled
									title="AI review is available when online"
									icon={<SparklesIcon />}
								/>
							)}
						</div>
					)}
					{rewriteError && (
						<p className="border-input bg-destructive/10 px-2 py-1 text-destructive text-xs">{rewriteError}</p>
					)}
					<EditorContent editor={editor} />
				</div>
			</Field>
		</div>
	);
}

function ToolbarButton({
	editor,
	onClick,
	active,
	title,
	icon,
	disabled,
}: {
	editor: Editor;
	onClick: () => void;
	active: boolean;
	title: string;
	icon: React.ReactNode;
	disabled?: boolean;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			title={title}
			aria-pressed={active}
			disabled={disabled}
			className={cn(active && "bg-muted text-foreground")}
			onClick={() => {
				if (disabled) return;
				onClick();
				editor.commands.focus();
			}}
		>
			{icon}
		</Button>
	);
}
