import { appendFileSync } from "node:fs";
import { join } from "node:path";

const LOG_PATH = join(__dirname, "..", "..", "..", "debug-298113.log");

export function debugLog(payload: {
	sessionId?: string;
	location: string;
	message: string;
	data?: Record<string, unknown>;
	timestamp: number;
	hypothesisId?: string;
}): void {
	try {
		appendFileSync(LOG_PATH, `${JSON.stringify(payload)}\n`);
	} catch {
		// ignore
	}
}
