import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	box,
	type DocumentTemplate,
	fixed,
	type LayoutNode,
	type LayoutTextNode,
	type ResumeDocument,
} from "@/core/document";
import type { RenderBoxNode, RenderTextNode, RenderTree } from "@/core/render/render-tree";
import { getTemplate } from "@/data/default-template";
import { A4_ASPECT } from "../constants";

interface ResumePreviewerProps {
	pageContentRef?: React.RefObject<HTMLDivElement | null>;
	pages: RenderTree[];
}
interface TextNodeRendererProps {
	text: string;
}
function TextNodeRenderer({ text }: TextNodeRendererProps) {
	return <span role="presentation">{text}</span>;
}

interface BoundValueRendererProps {
	dataKey: string;
}
function BoundValueRenderer({ dataKey }: BoundValueRendererProps) {
	const text = useWatch({ name: dataKey });
	return <TextNodeRenderer text={text} />;
}

interface DomRendererProps {
	node: RenderTree;
}

function DomRenderer({ node }: DomRendererProps) {
	switch (node.kind) {
		case "box": {
			return (
				<div>
					{node.children.map((child) => (
						<DomRenderer key={child.id} node={child} />
					))}
				</div>
			);
		}
		case "text": {
			if (node.src.kind === "fixed") {
				return <TextNodeRenderer text={node.src.value} />;
			}
			return <BoundValueRenderer dataKey={node.src.key} />;
		}
		default:
			return null;
	}
}

export function ResumePreviewer({ pages, pageContentRef }: ResumePreviewerProps) {
	return (
		<ScrollArea className="h-full w-full p-2 pl-0" type="scroll" scrollHideDelay={100}>
			<div ref={pageContentRef} className="flex flex-col items-center gap-2">
				{pages.map((page) => (
					<AspectRatio key={page.id} ratio={A4_ASPECT}>
						<div className="bg-card rounded-lg shadow-sm w-full h-full">
							<DomRenderer node={page} />
						</div>
					</AspectRatio>
				))}
			</div>
		</ScrollArea>
	);
}
