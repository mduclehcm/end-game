import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { BuilderSlice, DocumentSlice } from "./slices";
import { createBuilderSlice } from "./slices/builder-slice";
import { createDocumentSlice } from "./slices/document-slice";
import { createRenderEngineSlice, type RenderEngineSlice } from "./slices/render-engine-slice";

export type { BuilderSlice, RenderEngineSlice } from "./slices";

type BuilderState = BuilderSlice & DocumentSlice & RenderEngineSlice;

export const useBuilderStore = create<BuilderState>()(
	subscribeWithSelector((...args) => ({
		...createRenderEngineSlice(...args),
		...createBuilderSlice(...args),
		...createDocumentSlice(...args),
	})),
);
