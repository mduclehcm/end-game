import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { RenderBoxNode } from "@/core/render/render-tree";
import { A4_ASPECT } from "../../constants";

export interface PageRendererProps {
	node: RenderBoxNode;
}
export function PageRenderer({ node }: PageRendererProps) {
	return (
		<AspectRatio key={node.id} ratio={A4_ASPECT}>
			<div className="bg-card rounded-lg shadow-sm w-full h-full">
				<pre>{JSON.stringify(node, null, 2)}</pre>
			</div>
		</AspectRatio>
	);
}
