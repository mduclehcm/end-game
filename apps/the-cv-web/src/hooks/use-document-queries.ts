import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { documentQueryKeys } from "@/hooks/document-query-keys";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { fetchCloudDocumentList } from "@/lib/api";
import { saveLocalMirror } from "@/lib/storage";
import { mergeAndSortDocuments, mergeCloudWithLocalPending } from "@/lib/utils";
import { useCloudDocumentDetailQuery } from "./use-cloud-document-queries";
import { useLocalDocumentDetailQuery, useLocalDocumentListQuery } from "./use-local-document-queries";

export function useDocumentList() {
	const { isOnline } = useOnlineStatus();
	const { data: localDocuments } = useLocalDocumentListQuery();
	const cloudResult = useQuery({
		queryKey: documentQueryKeys.cloudList(),
		queryFn: fetchCloudDocumentList,
		enabled: isOnline,
	});

	const documents = useMemo(() => {
		if (!isOnline || !cloudResult.data) {
			return mergeAndSortDocuments([], localDocuments ?? []);
		}
		return mergeCloudWithLocalPending(cloudResult.data, localDocuments ?? []);
	}, [isOnline, cloudResult.data, localDocuments]);

	return {
		documents,
		isListLoading: isOnline && cloudResult.isPending,
		isListError: isOnline && cloudResult.isError,
		listError: cloudResult.error,
		refetchList: cloudResult.refetch,
	};
}

export function useDocumentDetail(id: string) {
	const { isOnline } = useOnlineStatus();
	const localQuery = useLocalDocumentDetailQuery(id);
	const cloudQuery = useCloudDocumentDetailQuery(id, { enabled: isOnline && !!id });

	// When cloud data is loaded, mirror to local
	useEffect(() => {
		if (cloudQuery.data) {
			saveLocalMirror(cloudQuery.data).catch(() => {});
		}
	}, [cloudQuery.data]);

	// When offline, use local only
	if (!isOnline) {
		return localQuery;
	}
	// When online: prefer cloud, fallback to local
	if (cloudQuery.data) {
		return cloudQuery;
	}
	if (cloudQuery.isError || cloudQuery.isPending) {
		return localQuery;
	}
	return localQuery;
}
