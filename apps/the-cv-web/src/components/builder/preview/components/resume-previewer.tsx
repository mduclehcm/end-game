import { useWatch } from "react-hook-form";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { RenderTree } from "@/core/render/render-tree";
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
			if (node.src.kind === "bind") {
				return <BoundValueRenderer dataKey={node.src.key} />;
			}
			// computed: not resolved in preview (no document/tokens here)
			return <TextNodeRenderer text="" />;
		}
		default:
			return null;
	}
}

export function ResumePreviewer({ pages, pageContentRef }: ResumePreviewerProps) {
	return (
		<ScrollArea className="h-full w-full" type="scroll" scrollHideDelay={100}>
			<div ref={pageContentRef} className="p-2 pl-0 flex flex-col items-center gap-2">
				<AspectRatio ratio={A4_ASPECT}>
					<div className="bg-card rounded-xl w-full h-full"></div>
				</AspectRatio>
				{pages.map((page) => (
					<AspectRatio key={page.id} ratio={A4_ASPECT}>
						<div className="bg-card rounded-xl w-full h-full">
							<DomRenderer node={page} />
						</div>
					</AspectRatio>
				))}
			</div>
		</ScrollArea>
	);
}
