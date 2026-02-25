import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Logger } from "@/lib/logger";

export type RelativeTimeProps = {
	date: string;
};

const logger = new Logger("relative-time");
export function RelativeTime({ date }: RelativeTimeProps) {
	const [time, setTime] = useState(() => {
		try {
			return formatDistanceToNow(new Date(date), { addSuffix: true });
		} catch (error) {
			logger.errorObj("failed to format date", error);
			return "N/A";
		}
	});
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (time !== "N/A") {
			interval = setInterval(() => {
				setTime(formatDistanceToNow(new Date(date), { addSuffix: true }));
			}, 60 * 1000); // update every minute
		}
		return () => {
			if (interval) {
				clearInterval(interval);
			}
		};
	}, [date, time]);
	return <span>{time}</span>;
}
