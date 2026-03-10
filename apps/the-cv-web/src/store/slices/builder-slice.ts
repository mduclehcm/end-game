import type { StateCreator } from "zustand";

export interface BuilderSlice {
	activeTab: string;
	activeField: string | null;

	debugMode: boolean;
	toggleDebugMode: () => void;

	setActiveField: (field: string | null) => void;
}

export const createBuilderSlice: StateCreator<BuilderSlice> = (set) => ({
	activeTab: "edit",
	activeField: null,
	debugMode: false,
	toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
	setActiveField: (field: string | null) => set(() => ({ activeField: field })),
});
