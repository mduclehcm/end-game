import type { DocumentData } from "@algo/cv-core";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DataEditor } from "@/components/builder/data-editor";
import { BuilderHeader } from "@/components/header/builder.header";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { type DocumentTemplate, fixed, type LayoutNode } from "@/core/document";
import type { RenderTree } from "@/core/render/render-tree";
import { useDocumentDetail } from "@/hooks/use-document-queries";
import { useBuilderStore } from "@/store";
import { Page } from "../share/page";
import { PreviewPanel } from "./preview";

const id = (() => {
	let current = 0;
	return () => (current++).toString();
})();

function getRenderNode(document: Record<string, string>, node: LayoutNode): RenderTree {
	switch (node.kind) {
		case "box": {
			return {
				id: id(),
				kind: "box",
				style: {},
				children: node.children.map((child) => getRenderNode(document, child)),
			};
		}
		case "text": {
			return {
				id: id(),
				kind: "text",
				src: node.src,
				style: {},
			};
		}
		default:
			return {
				id: id(),
				kind: "text",
				src: fixed(JSON.stringify(node, null, 2)),
				style: {},
			};
	}
}

export function renderTemplate(document: Record<string, string>, template: DocumentTemplate): RenderTree[] {
	const pages: RenderTree[] = [];

	const currentPage = getRenderNode(document, template.layout);
	pages.push(currentPage);
	return pages;
}

const DEFAULT_LAYOUT = { side: 45, preview: 55 };

function Builder() {
	return (
		<div className="h-screen w-screen flex flex-col bg-muted">
			<BuilderHeader />
			<ResizablePanelGroup className="h-full w-full" defaultLayout={DEFAULT_LAYOUT}>
				<ResizablePanel id="side" minSize={"600px"} maxSize={"1000px"} collapsible>
					<ScrollArea className="h-full w-full" type="scroll" scrollHideDelay={100}>
						<DataEditor />
					</ScrollArea>
				</ResizablePanel>
				<ResizableHandle className="m-1" withHandle />
				<ResizablePanel id="preview" minSize={"500px"} className="relative overflow-hidden">
					<PreviewPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}

const BuilderPage = Page(() => {
	const { id = "" } = useParams<{ id: string }>();
	const location = useLocation();
	const documentDetailQuery = useDocumentDetail(id);
	const [loading, setLoading] = useState(true);
	const setDocument = useBuilderStore((state) => state.setDocument);

	useEffect(() => {
		if (!documentDetailQuery.data) return;
		const doc = documentDetailQuery.data;
		const hasStructure = doc.data.sectionIds.length > 0 && doc.data.sections.length > 0;
		const initialData = location.state?.initialDocumentData as DocumentData | undefined;
		// When opening a newly created CV, use full initialData (sections/entities) if the loaded doc has none
		const dataToSet = hasStructure ? doc.data : (initialData ?? doc.data);
		// #region agent log
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d54723" },
			body: JSON.stringify({
				sessionId: "d54723",
				runId: "post-fix",
				location: "builder.page.tsx:useEffect",
				message: "setDocument data",
				data: {
					hasStructure,
					docSectionCount: doc.data.sections.length,
					docSectionIds: doc.data.sectionIds.length,
					initialDataSections: initialData?.sections?.length ?? "none",
					dataToSetSections: dataToSet.sections.length,
					dataToSetEntities: dataToSet.sections.map((s) => ({ kind: s.kind, entityCount: s.entities.length })),
				},
				timestamp: Date.now(),
				hypothesisId: "H3",
			}),
		}).catch(() => {});
		// #endregion
		setDocument({
			...doc,
			data: dataToSet,
		});
		setLoading(false);
	}, [documentDetailQuery.data, location.state?.initialDocumentData, setDocument]);

	if (!id) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<p className="text-muted-foreground">Invalid resume</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<div className="flex items-center gap-2">
					<Spinner />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return <Builder />;
});

BuilderPage.displayName = "BuilderPage";

export default BuilderPage;
