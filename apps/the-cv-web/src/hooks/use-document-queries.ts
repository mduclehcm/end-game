import type { UseMutationOptions, UseQueryOptions } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { UserDocument } from "@/core/document";
import { getDefaultDocument } from "@/data/default-cv";
// import { createDefaultUserDocument } from "@/data/default-cv";
import {
	type DocumentListItem,
	deleteDocument,
	fetchDocumentDetail,
	fetchDocumentList,
	saveDocument,
} from "@/lib/storage";

export const documentQueryKeys = {
	all: ["document"] as const,
	list: () => [...documentQueryKeys.all, "list"] as const,
	detail: (id: string) => [...documentQueryKeys.all, "detail", id] as const,
};

export function useDocumentListQuery(options?: Omit<UseQueryOptions<DocumentListItem[]>, "queryKey" | "queryFn">) {
	return useQuery({
		queryKey: documentQueryKeys.list(),
		queryFn: fetchDocumentList,
		...options,
	});
}

export function useDocumentDetailQuery(
	id: string | null | undefined,
	options?: Omit<UseQueryOptions<UserDocument | null>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: documentQueryKeys.detail(id ?? ""),
		queryFn: () => (id ? fetchDocumentDetail(id) : Promise.resolve(null)),
		enabled: Boolean(id),
		...options,
	});
}

type SaveDocumentMutationVariables = { userDoc: UserDocument };
type SaveDocumentMutationContext = unknown;

export function useSaveDocumentMutation(
	options?: UseMutationOptions<void, Error, SaveDocumentMutationVariables, SaveDocumentMutationContext>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ userDoc }: SaveDocumentMutationVariables) => {
			saveDocument(userDoc);
		},
		onSuccess: (_data, { userDoc }) => {
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
			queryClient.invalidateQueries({
				queryKey: documentQueryKeys.detail(userDoc.id),
			});
		},
		...options,
	});
}

type DeleteDocumentMutationVariables = { id: string };
type DeleteDocumentMutationContext = unknown;

export function useCreateAndNavigate() {
	const navigate = useNavigate();
	const saveMutation = useSaveDocumentMutation();

	const createAndNavigate = () => {
		const fields = getDefaultDocument();
		const userDoc: UserDocument = {
			id: crypto.randomUUID(),
			title: "New Resume",
			fields,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		saveMutation.mutate(
			{ userDoc },
			{ onSuccess: () => navigate(`/resumes/${userDoc.id}`, { state: { internal: true } }) },
		);
	};

	return { createAndNavigate, isPending: saveMutation.isPending };
}

export function useDeleteDocumentMutation(
	options?: UseMutationOptions<void, Error, DeleteDocumentMutationVariables, DeleteDocumentMutationContext>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ id }: DeleteDocumentMutationVariables) => {
			deleteDocument(id);
		},
		onSuccess: (_data, { id }) => {
			queryClient.invalidateQueries({ queryKey: documentQueryKeys.list() });
			queryClient.removeQueries({ queryKey: documentQueryKeys.detail(id) });
		},
		...options,
	});
}
