import { updateCloudDocumentFields } from "@/lib/api";
import { Logger } from "@/lib/logger";
import { updateLocalDocument } from "@/lib/storage";
import { addPendingUpdate } from "@/lib/sync-queue";
import type { useBuilderStore } from "./builder-store";
import { useSyncStatusStore } from "./sync-status-store";

type BuilderStore = typeof useBuilderStore;

const logger = new Logger("auto-save");

function getChangedFields(
	current: Record<string, string>,
	baseline: Record<string, string>,
): Record<string, string> | null {
	const changed: Record<string, string> = {};
	let hasChanges = false;

	for (const [key, value] of Object.entries(current)) {
		if (baseline[key] !== value) {
			changed[key] = value;
			hasChanges = true;
		}
	}

	return hasChanges ? changed : null;
}

export function setupAutoSave(store: BuilderStore, throttleMs = 250) {
	let lastRun = 0;
	let timer: ReturnType<typeof setTimeout> | null = null;
	let baselineFields: Record<string, string> = {};

	function performSave() {
		const state = store.getState();
		if (!state.documentId) return;

		const changed = getChangedFields(state.data.fieldValues, baselineFields);
		if (!changed) {
			state.setSaveStatus("idle");
			return;
		}

		const id = state.documentId;
		const isOnline = typeof navigator !== "undefined" && navigator.onLine;

		// Always persist to local first
		updateLocalDocument(id, changed)
			.then(() => {
				if (isOnline) {
					return updateCloudDocumentFields(id, changed).then(
						() => {
							baselineFields = { ...store.getState().data.fieldValues };
							store.getState().setSaveStatus("saved");
						},
						(err) => {
							logger.errorObj("auto-save cloud failed", err);
							useSyncStatusStore.getState().setSyncFailed(true);
							addPendingUpdate({ id, fields: changed });
							baselineFields = { ...store.getState().data.fieldValues };
							store.getState().setSaveStatus("saved");
						},
					);
				} else {
					addPendingUpdate({ id, fields: changed });
					baselineFields = { ...store.getState().data.fieldValues };
					store.getState().setSaveStatus("saved");
				}
			})
			.catch((err) => logger.errorObj("auto-save local failed", err));
	}

	function throttledSave() {
		const now = Date.now();
		const elapsed = now - lastRun;

		if (timer) clearTimeout(timer);

		if (elapsed >= throttleMs) {
			lastRun = now;
			performSave();
		} else {
			timer = setTimeout(() => {
				lastRun = Date.now();
				timer = null;
				performSave();
			}, throttleMs - elapsed);
		}
	}

	store.subscribe(
		(state) => state.documentId,
		() => {
			baselineFields = { ...store.getState().data.fieldValues };
		},
	);

	store.subscribe(
		(state) => state.data.fieldValues,
		() => {
			const { documentId } = store.getState();
			if (!documentId) return;

			store.getState().setSaveStatus("saving");
			throttledSave();
		},
	);
}
