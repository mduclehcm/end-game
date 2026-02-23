import { ResumePreviewer } from "@/components/builder/preview/components/resume-previewer";

export const PreviewPanel = () => {
	const pages: any[] = [];
	return (
		<div className="flex-1 h-full relative">
			<ResumePreviewer pages={pages} />
		</div>
	);
};
