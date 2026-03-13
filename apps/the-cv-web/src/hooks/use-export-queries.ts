import { useQuery } from "@tanstack/react-query";
import { fetchExportList } from "@/lib/api";

const exportListKey = ["resume", "exports"] as const;

export function useExportList() {
	const result = useQuery({
		queryKey: exportListKey,
		queryFn: fetchExportList,
	});
	return {
		exports: result.data ?? [],
		isLoading: result.isPending,
		isError: result.isError,
		error: result.error,
		refetch: result.refetch,
	};
}
