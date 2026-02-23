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

export interface ValidationRule {
	type: "min" | "max" | "pattern" | "custom";
	value: string | number;
	message: string;
}
