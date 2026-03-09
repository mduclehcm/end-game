import type { DocumentDetail, DocumentInfo } from "@algo/cv-core";
import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { documentQueryKeys } from "@/hooks/document-query-keys";
import { Logger } from "@/lib/logger";
import type { SaveDocumentPayload } from "@/lib/storage";
import * as storage from "@/lib/storage";

const logger = new Logger("local-document-queries");

export function useLocalDocumentListQuery(options?: Omit<UseQueryOptions<DocumentInfo[]>, "queryKey" | "queryFn">) {
	return useSuspenseQuery({
		queryKey: documentQueryKeys.localList(),
		queryFn: storage.getDocumentList,
		...options,
	});
}

export function useLocalDocumentDetailQuery(
	id: string,
	options?: Omit<UseQueryOptions<DocumentDetail | null>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: documentQueryKeys.localDetail(id),
		queryFn: ({ queryKey }) => {
			const id = documentQueryKeys.idFromLocDetailQueryKey(queryKey);
			return storage.getDocumentById(id);
		},
		...options,
	});
}

export function useCreateLocalDocument(
	options?: UseMutationOptions<DocumentDetail, Error, SaveDocumentPayload, unknown>,
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: storage.saveDocument,
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.localList() });
			queryClient.setQueryData(documentQueryKeys.localDetail(data.id), data);
		},
		...options,
	});
}

export function useDeleteLocalDocument(options?: UseMutationOptions<boolean, Error, string, unknown>) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: storage.deleteDocument,
		onSuccess: (success, id) => {
			if (!success) return;
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.localList() });
			queryClient.removeQueries({ queryKey: documentQueryKeys.localDetail(id) });
		},
		onError: (error) => {
			logger.errorObj("failed to delete document", error);
		},
		...options,
	});
}
