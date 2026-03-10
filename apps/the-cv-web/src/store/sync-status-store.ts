import { create } from "zustand";

type SyncStatusState = {
	syncFailed: boolean;
	setSyncFailed: (value: boolean) => void;
};

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
	syncFailed: false,
	setSyncFailed: (value) => set({ syncFailed: value }),
}));
