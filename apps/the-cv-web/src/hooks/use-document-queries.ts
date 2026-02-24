import { useMemo } from "react";
import { mergeAndSortDocuments } from "@/lib/utils";
import { useCloudDocumentDetailQuery, useCloudDocumentListQuery } from "./use-cloud-document-queries";
import { useLocalDocumentDetailQuery, useLocalDocumentListQuery } from "./use-local-document-queries";

export function useDocumentList() {
	const { data: localDocuments } = useLocalDocumentListQuery();
	const { data: cloudDocuments } = useCloudDocumentListQuery();

	return useMemo(() => mergeAndSortDocuments(localDocuments, cloudDocuments), [cloudDocuments, localDocuments]);
}

export function useDocumentDetail(id: string, isCloudDocument: boolean) {
	const localDocument = useLocalDocumentDetailQuery(id, { enabled: !isCloudDocument });
	const cloudDocument = useCloudDocumentDetailQuery(id, { enabled: isCloudDocument });

	if (isCloudDocument) {
		return cloudDocument;
	}
	return localDocument;
}
