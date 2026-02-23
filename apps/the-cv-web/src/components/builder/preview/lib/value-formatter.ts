import type { DateRange } from "@/core/document/shared";
import { formatDateRange } from "../utils";

/**
 * Turn resolved template values (e.g. date range objects) into React-safe display strings.
 */
export function toDisplayString(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (typeof value === "object" && value !== null && "start" in value && ("end" in value || "present" in value)) {
		return formatDateRange(value as DateRange);
	}
	return String(value);
}
