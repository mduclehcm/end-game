import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { runSyncQueue } from "@/lib/sync-runner";
import { useSyncStatusStore } from "@/store/sync-status-store";

export function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true,
	);
	const queryClient = useQueryClient();
	const syncFailed = useSyncStatusStore((s) => s.syncFailed);

	const runSync = useCallback(() => {
		runSyncQueue({
			queryClient,
			onTempIdReplaced: (tempId, cloudId) => {
				const path = window.location.pathname;
				if (path === `/doc/${tempId}` || path === `/c/${tempId}`) {
					window.history.replaceState(null, "", `/doc/${cloudId}`);
				}
			},
		});
	}, [queryClient]);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			runSync();
		};
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [runSync]);

	return { isOnline, syncFailed, runSync };
}
