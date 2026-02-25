import { ResumePreviewer } from "@/components/builder/preview/components/resume-previewer";
import type { RenderTree } from "@/core/render/render-tree";

export const PreviewPanel = () => {
	const pages: RenderTree[] = [];
	return (
		<div className="flex-1 h-full relative">
			<ResumePreviewer pages={pages} />
		</div>
	);
};
