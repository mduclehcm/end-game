import type { StateCreator } from "zustand";
import type { RenderTree } from "@/core/render/render-tree";

export interface RenderEngineSlice {
	tree: RenderTree[];
	setTree: (tree: RenderTree[]) => void;
}

export const createRenderEngineSlice: StateCreator<RenderEngineSlice> = (set) => ({
	tree: [],
	setTree: (tree) => set(() => ({ tree })),
});
