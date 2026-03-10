import type { CreateDocumentPayload, DocumentData } from "@algo/cv-core";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateLocalDocument, useDeleteLocalDocument } from "@/hooks/use-local-document-queries";
import { Logger } from "@/lib/logger";
import { useCreateCloudDocument, useDeleteCloudDocument } from "./use-cloud-document-actions";

const logger = new Logger("document-actions");

export type CreateDocumentOptions = CreateDocumentPayload & {
	localOnly: boolean;
	initialData?: DocumentData;
};

export function useCreateDocument() {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const localMutation = useCreateLocalDocument();
	const cloudMutation = useCreateCloudDocument();

	const createDocument = useCallback(
		({ title, localOnly, initialData }: CreateDocumentOptions) => {
			setLoading(true);
			if (!localOnly) {
				const payload: CreateDocumentPayload = {
					title,
					...(initialData?.fieldValues &&
						Object.keys(initialData.fieldValues).length > 0 && {
							fieldValues: initialData.fieldValues,
						}),
				};
				cloudMutation.mutate(payload, {
					onSuccess: (documentDetail) => {
						setLoading(false);
						navigate(`/c/${documentDetail.id}`, {
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
							setLoading(false);
							navigate(`/r/${documentDetail.id}`, {
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
		[cloudMutation, navigate, localMutation],
	);

	return {
		createDocument,
		loading,
	};
}

export type DeleteDocumentParams = {
	id: string;
	isCloudDocument: boolean;
	onSuccess?: () => void;
};

export function useDeleteDocument() {
	const deleteLocalMutation = useDeleteLocalDocument();
	const deleteCloudMutation = useDeleteCloudDocument();

	const deleteDocument = useCallback(
		({ id, isCloudDocument, onSuccess }: DeleteDocumentParams) => {
			logger.info(`deleting document ${id} (isCloudDocument: ${isCloudDocument})`);
			if (isCloudDocument) {
				deleteCloudMutation.mutate(id, { onSuccess });
			} else {
				deleteLocalMutation.mutate(id, { onSuccess });
			}
		},
		[deleteCloudMutation, deleteLocalMutation],
	);

	return {
		deleteDocument,
		loading: deleteLocalMutation.isPending || deleteCloudMutation.isPending,
	};
}
