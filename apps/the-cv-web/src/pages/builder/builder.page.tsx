import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BuilderHeader } from "@/components/header/builder.header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import { type DocumentTemplate, fixed, type LayoutNode } from "@/core/document";
import type { RenderTree } from "@/core/render/render-tree";
import { useDocumentDetailQuery } from "@/hooks/use-document-queries";
import { Logger } from "@/lib/logger";
import { PageErrorBoundary } from "@/pages/share/error.page";
import { useBuilderStore } from "@/store";
import { PreviewPanel } from "./preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataEditor } from "@/components/builder/data-editor";

const logger = new Logger("builder-page");

const id = (() => {
  let current = 0;
  return () => (current++).toString();
})();

function getRenderNode(
  document: Record<string, string>,
  node: LayoutNode,
): RenderTree {
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

export function renderTemplate(
  document: Record<string, string>,
  template: DocumentTemplate,
): RenderTree[] {
  const pages: RenderTree[] = [];

  const currentPage = getRenderNode(document, template.layout);
  pages.push(currentPage);
  return pages;
}

const DEFAULT_LAYOUT = { side: 45, preview: 55 };

function Builder() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background max-w-[1600px] mx-auto">
      <BuilderHeader />
      <ResizablePanelGroup
        className="h-full w-full"
        defaultLayout={DEFAULT_LAYOUT}
      >
        <ResizablePanel
          id="side"
          minSize={"600px"}
          maxSize={"1000px"}
          collapsible
        >
          <ScrollArea
            className="h-full w-full"
            type="scroll"
            scrollHideDelay={100}
          >
            <DataEditor />
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle className="m-1" />
        <ResizablePanel
          id="preview"
          minSize={"500px"}
          className="relative overflow-hidden"
        >
          <PreviewPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

function BuilderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: document } = useDocumentDetailQuery(id);
  const [loading, setLoading] = useState(true);

  const setDocument = useBuilderStore((state) => state.setDocument);

  useEffect(() => {
    if (document) {
      setDocument(document);
      setLoading(false);
    }
  }, [document, setDocument]);

  if (!id || !(document && !loading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p className="text-muted-foreground">
          {!id ? "Invalid resume" : "Resume not found"}
        </p>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="flex items-center gap-2">
            <Spinner />
            <p className="text-muted-foreground">Loading…</p>
          </div>
        </div>
      )}
      {!loading && <Builder />}
    </>
  );
}

export default function BuilderPageWithErrorBoundary() {
  useEffect(() => {
    logger.info("page view");
  }, []);

  return (
    <PageErrorBoundary>
      <BuilderPage />
    </PageErrorBoundary>
  );
}
