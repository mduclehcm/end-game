import { DocumentSource } from "@algo/cv-core";
import { updateCloudDocument } from "@/lib/api";
import { Logger } from "@/lib/logger";
import { updateLocalDocument } from "@/lib/storage";
import type { useBuilderStore } from "./builder-store";

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

		const save =
			state.documentSource === DocumentSource.Cloud
				? updateCloudDocument(state.documentId, changed)
				: updateLocalDocument(state.documentId, changed);

		save
			.then(() => {
				baselineFields = { ...store.getState().data.fieldValues };
				store.getState().setSaveStatus("saved");
			})
			.catch((err) => logger.errorObj("auto-save failed", err));
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
