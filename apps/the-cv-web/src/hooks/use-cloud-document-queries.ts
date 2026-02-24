import type { DocumentDetail, DocumentInfo } from "@algo/cv-core";
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { documentQueryKeys } from "@/hooks/document-query-keys";
import { fetchCloudDocumentDetail, fetchCloudDocumentList } from "@/lib/api";

export function useCloudDocumentListQuery(options?: Omit<UseQueryOptions<DocumentInfo[]>, "queryKey" | "queryFn">) {
	return useSuspenseQuery({
		queryKey: documentQueryKeys.cloudList(),
		queryFn: fetchCloudDocumentList,
		...options,
	});
}

export function useCloudDocumentDetailQuery(
	id: string,
	options?: Omit<UseQueryOptions<DocumentDetail | null>, "queryKey" | "queryFn">,
) {
	return useQuery({
		queryKey: documentQueryKeys.cloudDetail(id),
		queryFn: () => fetchCloudDocumentDetail(id),
		enabled: options?.enabled,
		...options,
	});
}
