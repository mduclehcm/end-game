export interface Spacing {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

export interface TextStyle {
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number | string;
	fontStyle?: "normal" | "italic";
	color?: string;
	textAlign?: "left" | "center" | "right" | "justify";
	textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
	textDecoration?: "none" | "underline" | "line-through";
	letterSpacing?: number;
	lineHeight?: number;
}

export interface DateRange {
	start: string | null;
	end: string | null;
	present?: boolean;
}

export interface SelectOption {
	label: string;
	value: string;
}

/** Value that a form field can hold (string, number, date range, select, array, or empty). */
export type FieldValue = string | number | DateRange | SelectOption | unknown[] | null | undefined;

export const FieldType = {
	DATE_RANGE: "date_range",
	RATING: "rating",
} as const;

export type FieldTypeValue = (typeof FieldType)[keyof typeof FieldType];

export interface FieldSchema {
	type: string;
}

export interface ValidationRule {
	type: "min" | "max" | "pattern" | "custom";
	value: string | number;
	message: string;
}
