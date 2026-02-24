import type { CreateDocumentPayload, DocumentDetail } from "@algo/cv-core";
import type { UseMutationOptions } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCloudResumeDocument, deleteCloudResumeDocument } from "@/lib/api";
import { documentQueryKeys } from "./document-query-keys";

export function useCreateCloudDocument(options?: UseMutationOptions<DocumentDetail, Error, CreateDocumentPayload>) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCloudResumeDocument,
		onSuccess: (documentDetail) => {
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.cloudList() });
			queryClient.setQueryData(documentQueryKeys.cloudDetail(documentDetail.id), documentDetail);
		},
		...options,
	});
}

export function useDeleteCloudDocument(options?: UseMutationOptions<boolean, Error, string>) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteCloudResumeDocument,
		onSuccess: (success, id) => {
			if (!success) return;
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.cloudList() });
			queryClient.removeQueries({ queryKey: documentQueryKeys.cloudDetail(id) });
		},
		...options,
	});
}
