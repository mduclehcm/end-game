import type { CreateDocumentPayload, DocumentData } from "@algo/cv-core";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentQueryKeys } from "@/hooks/document-query-keys";
import { useCreateLocalDocument, useDeleteLocalDocument } from "@/hooks/use-local-document-queries";
import { Logger } from "@/lib/logger";
import { saveLocalMirror } from "@/lib/storage";
import { addPendingCreate, addPendingDelete } from "@/lib/sync-queue";
import { useCreateCloudDocument, useDeleteCloudDocument } from "./use-cloud-document-actions";
import { useOnlineStatus } from "./use-online-status";

const logger = new Logger("document-actions");

export type CreateDocumentOptions = CreateDocumentPayload & {
	initialData?: DocumentData;
};

export function useCreateDocument() {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { isOnline } = useOnlineStatus();
	const localMutation = useCreateLocalDocument();
	const cloudMutation = useCreateCloudDocument();

	const createDocument = useCallback(
		({ title, initialData }: CreateDocumentOptions) => {
			setLoading(true);
			if (isOnline) {
				const payload: CreateDocumentPayload = {
					title,
					...(initialData?.fieldValues &&
						Object.keys(initialData.fieldValues).length > 0 && {
							fieldValues: initialData.fieldValues,
						}),
				};
				cloudMutation.mutate(payload, {
					onSuccess: async (documentDetail) => {
						try {
							await saveLocalMirror(documentDetail);
							queryClient.invalidateQueries({ queryKey: documentQueryKeys.localList() });
						} finally {
							setLoading(false);
						}
						navigate(`/doc/${documentDetail.id}`, {
							state: {
								internal: true,
								initialDocumentData: documentDetail.data ?? initialData,
							},
						});
					},
					onError: () => {
						setLoading(false);
					},
				});
			} else {
				localMutation.mutate(
					{ title, initialData },
					{
						onSuccess: (documentDetail) => {
							addPendingCreate({
								tempId: documentDetail.id,
								title: documentDetail.title,
								data: documentDetail.data,
							});
							setLoading(false);
							navigate(`/doc/${documentDetail.id}`, {
								state: { internal: true, initialDocumentData: initialData },
							});
						},
						onError: () => {
							setLoading(false);
						},
					},
				);
			}
		},
		[cloudMutation, isOnline, localMutation, navigate, queryClient],
	);

	return {
		createDocument,
		loading,
	};
}

export type DeleteDocumentParams = {
	id: string;
	onSuccess?: () => void;
};

export function useDeleteDocument() {
	const queryClient = useQueryClient();
	const { isOnline } = useOnlineStatus();
	const deleteLocalMutation = useDeleteLocalDocument();
	const deleteCloudMutation = useDeleteCloudDocument();

	const deleteDocument = useCallback(
		({ id, onSuccess }: DeleteDocumentParams) => {
			logger.info(`deleting document ${id} (isOnline: ${isOnline})`);
			if (isOnline) {
				deleteCloudMutation.mutate(id, {
					onSuccess: (success) => {
						if (!success) return;
						deleteLocalMutation.mutate(id, {
							onSuccess: () => {
								queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
								onSuccess?.();
							},
						});
					},
				});
			} else {
				deleteLocalMutation.mutate(id, {
					onSuccess: (success) => {
						if (!success) return;
						addPendingDelete(id);
						queryClient.invalidateQueries({ queryKey: documentQueryKeys.all });
						onSuccess?.();
					},
				});
			}
		},
		[deleteCloudMutation, deleteLocalMutation, isOnline, queryClient],
	);

	return {
		deleteDocument,
		loading: deleteLocalMutation.isPending || deleteCloudMutation.isPending,
	};
}
