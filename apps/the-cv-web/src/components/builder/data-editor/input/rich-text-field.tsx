import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BoldIcon, ItalicIcon, ListIcon, ListOrderedIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
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
};

export function BuilderRichTextInput({
	className,
	name,
	label,
	placeholder = "Start writing…",
	field,
	dataKey,
}: BuilderRichTextInputProps) {
	const value = useBuilderStore((state) => state.data.fieldValues[field] ?? "");
	const setValue = useBuilderStore((state) => state.setFieldValue);
	const setActiveField = useBuilderStore((state) => state.setActiveField);

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

	return (
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
					</div>
				)}
				<EditorContent editor={editor} />
			</div>
		</Field>
	);
}

function ToolbarButton({
	editor,
	onClick,
	active,
	title,
	icon,
}: {
	editor: Editor;
	onClick: () => void;
	active: boolean;
	title: string;
	icon: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			title={title}
			aria-pressed={active}
			className={cn(active && "bg-muted text-foreground")}
			onClick={() => {
				onClick();
				editor.commands.focus();
			}}
		>
			{icon}
		</Button>
	);
}
