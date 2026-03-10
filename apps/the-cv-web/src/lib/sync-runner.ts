import type { QueryClient } from "@tanstack/react-query";
import {
	createCloudResumeDocument,
	deleteCloudResumeDocument,
	updateCloudDocumentFields,
} from "@/lib/api";
import { Logger } from "@/lib/logger";
import {
	clearSyncQueue,
	getSyncQueue,
	removePendingCreate,
	removePendingDelete,
	removePendingUpdate,
} from "@/lib/sync-queue";
import {
	deleteDocument,
	replaceTempIdWithCloudId,
	saveLocalMirror,
} from "@/lib/storage";
import { documentQueryKeys } from "@/hooks/document-query-keys";
import { useSyncStatusStore } from "@/store/sync-status-store";

const logger = new Logger("sync-runner");

export type RunSyncOptions = {
	queryClient: QueryClient;
	onTempIdReplaced?: (tempId: string, cloudId: string) => void;
};

export async function runSyncQueue(options: RunSyncOptions): Promise<void> {
	const { queryClient, onTempIdReplaced } = options;
	useSyncStatusStore.getState().setSyncFailed(false);
	const queue = getSyncQueue();

	try {
		// 1. Pending creates: POST to cloud, then replace temp id with cloud id in local storage
		for (const create of queue.creates) {
			try {
				const payload = {
					title: create.title,
					...(Object.keys(create.data.fieldValues ?? {}).length > 0 && {
						fieldValues: create.data.fieldValues,
					}),
				};
				const cloudDetail = await createCloudResumeDocument(payload);
				await replaceTempIdWithCloudId(create.tempId, cloudDetail);
				removePendingCreate(create.tempId);
				onTempIdReplaced?.(create.tempId, cloudDetail.id);
			} catch (err) {
				logger.errorObj("sync create failed", err);
				useSyncStatusStore.getState().setSyncFailed(true);
				return;
			}
		}

		// 2. Pending updates: PATCH cloud, then update local copy
		for (const update of queue.updates) {
			try {
				const cloudDetail = await updateCloudDocumentFields(update.id, update.fields);
				await saveLocalMirror(cloudDetail);
				removePendingUpdate(update.id);
			} catch (err) {
				logger.errorObj("sync update failed", err);
				useSyncStatusStore.getState().setSyncFailed(true);
				return;
			}
		}

		// 3. Pending deletes: DELETE from cloud, remove from local
		for (const del of queue.deletes) {
			try {
				await deleteCloudResumeDocument(del.id);
				await deleteDocument(del.id);
				removePendingDelete(del.id);
			} catch (err) {
				logger.errorObj("sync delete failed", err);
				useSyncStatusStore.getState().setSyncFailed(true);
				return;
			}
		}

		clearSyncQueue();
	} finally {
		queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
	}
}
