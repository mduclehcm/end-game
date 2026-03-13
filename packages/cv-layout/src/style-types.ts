/** Resolved padding/margin: always a full box (all sides). */
export interface SpaceBox {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/** CSS shorthand for padding/margin from a SpaceBox. */
export function spaceBoxToCss(box: SpaceBox): string {
	return `${box.top}px ${box.right}px ${box.bottom}px ${box.left}px`;
}

export interface ResolvedStyleProps {
	position?: "absolute" | "relative" | "static";
	width?: number | string;
	height?: number | string;
	padding?: SpaceBox;
	margin?: SpaceBox;
	gap?: number;

	fontFamily?: string;
	fontSize?: number;
	fontWeight?: number;
	fontStyle?: "normal" | "italic" | "oblique";
	lineHeight?: number;
	textAlign?: "left" | "center" | "right" | "justify";
	textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

	color?: string;
	backgroundColor?: string;
	borderColor?: string;

	borderWidth?: number;
	borderRadius?: number;
}
