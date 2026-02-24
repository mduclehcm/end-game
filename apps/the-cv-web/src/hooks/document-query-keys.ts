import type { QueryKey } from "@tanstack/react-query";

export const documentQueryKeys = {
	all: ["document"] as const,

	cloudList: () => [...documentQueryKeys.all, "cloud-list"] as const,
	localList: () => [...documentQueryKeys.all, "local-list"] as const,

	localDetail: (id: string) => [...documentQueryKeys.all, "local-detail", id] as const,
	cloudDetail: (id: string) => [...documentQueryKeys.all, "cloud-detail", id] as const,

	idFromLocDetailQueryKey: (queryKey: QueryKey) => queryKey[documentQueryKeys.localDetail("").length - 1] as string,
};
