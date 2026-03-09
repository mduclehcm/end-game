import type { DateRange, FieldSchema, FieldValue, SelectOption, TextStyle } from "@/core/document";
import { FieldType } from "@/core/document";

export function textStyleToCSS(style?: TextStyle): React.CSSProperties {
	if (!style) return {};
	return {
		fontFamily: style.fontFamily,
		fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
		fontWeight: style.fontWeight as React.CSSProperties["fontWeight"],
		fontStyle: style.fontStyle,
		color: style.color,
		textAlign: style.textAlign,
		textTransform: style.textTransform,
		textDecoration: style.textDecoration,
		letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
		lineHeight: style.lineHeight,
	};
}

export function formatDateRange(range: DateRange): string {
	const formatDate = (d: string) => {
		const date = new Date(d);
		return date.toLocaleDateString("en-US", {
			month: "short",
			year: "numeric",
		});
	};
	const start = range.start ? formatDate(range.start) : "";
	const end = range.present ? "Present" : range.end ? formatDate(range.end) : "";
	if (!start && !end) return "";
	if (start && end) return `${start} – ${end}`;
	return start || end;
}

export function isFieldEmpty(value: FieldValue): boolean {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return value.trim() === "";
	if (Array.isArray(value)) return value.length === 0;
	if (typeof value === "object" && "start" in value) {
		const dr = value as DateRange;
		return !dr.start && !dr.end && !dr.present;
	}
	if (typeof value === "object" && "label" in value) {
		return !(value as SelectOption).value;
	}
	return false;
}

export function getDisplayValue(value: FieldValue, fieldSchema: FieldSchema): string | null {
	if (isFieldEmpty(value)) return null;

	switch (fieldSchema.type) {
		case FieldType.DATE_RANGE:
			return formatDateRange(value as DateRange);
		case FieldType.RATING:
			return value ? `${value}/5` : null;
		default:
			return typeof value === "string" ? value : String(value);
	}
}
