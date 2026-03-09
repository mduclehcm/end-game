import type { Fragment, FragmentTree, PageFragment } from "@/core/layout";
import type { ResolvedStyleProps } from "@/core/render/render-tree";

function applyResolvedStyle(style: ResolvedStyleProps): React.CSSProperties {
	const s: React.CSSProperties = {};
	if (style.padding != null) s.padding = `${style.padding}px`;
	if (style.margin != null) s.margin = `${style.margin}px`;
	if (style.fontSize != null) s.fontSize = `${style.fontSize}px`;
	if (style.fontWeight != null) s.fontWeight = String(style.fontWeight);
	if (style.fontFamily != null) s.fontFamily = style.fontFamily;
	if (style.lineHeight != null) s.lineHeight = style.lineHeight;
	if (style.color != null) s.color = style.color;
	if (style.backgroundColor != null) s.backgroundColor = style.backgroundColor;
	return s;
}

function FragmentContentRenderer({ fragment }: { fragment: Fragment }) {
	const { content } = fragment;
	switch (content.kind) {
		case "text": {
			const { fullContent, lineStart, lineCount, style, isHtml } = content;
			const lineHeight = style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : 16);
			const heightPx = lineCount * lineHeight;
			const innerStyle = { transform: `translateY(-${lineStart * lineHeight}px)` };
			return (
				<div
					style={{
						...applyResolvedStyle(style),
						height: heightPx,
						overflow: "hidden",
						boxSizing: "border-box",
					}}
				>
					{isHtml ? (
						// User-edited rich text (HTML) from builder; safe to render
						// biome-ignore lint/security/noDangerouslySetInnerHtml: CV content from builder store
						<div style={innerStyle} dangerouslySetInnerHTML={{ __html: fullContent }} />
					) : (
						<div style={innerStyle}>{fullContent}</div>
					)}
				</div>
			);
		}
		case "image": {
			const { src, alt, style } = content;
			return (
				<img
					src={src}
					alt={alt ?? ""}
					style={{
						display: "block",
						width: fragment.width,
						height: fragment.height,
						objectFit: "contain",
						...applyResolvedStyle(style),
					}}
				/>
			);
		}
		case "block": {
			const { children } = content;
			const useAbsolute = fragment.position === "absolute";
			return (
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: fragment.width,
						height: fragment.height,
						boxSizing: "border-box",
						position: useAbsolute ? "relative" : undefined,
					}}
				>
					{children.map((child) =>
						useAbsolute ? (
							<div
								key={child.id}
								style={{
									position: "absolute",
									left: child.x - fragment.x,
									top: child.y - fragment.y,
									width: child.width,
									height: child.height,
									boxSizing: "border-box",
								}}
							>
								<FragmentContentRenderer fragment={child} />
							</div>
						) : (
							<div
								key={child.id}
								style={{
									width: child.width,
									height: child.height,
									flexShrink: 0,
									boxSizing: "border-box",
								}}
							>
								<FragmentContentRenderer fragment={child} />
							</div>
						),
					)}
				</div>
			);
		}
	}
}

function FragmentRenderer({ fragment }: { fragment: Fragment }) {
	const useAbsolute = fragment.position === "absolute";
	return (
		<div
			key={fragment.id}
			style={
				useAbsolute
					? {
							position: "absolute",
							left: fragment.x,
							top: fragment.y,
							width: fragment.width,
							height: fragment.height,
							boxSizing: "border-box",
						}
					: {
							width: fragment.width,
							height: fragment.height,
							flexShrink: 0,
							boxSizing: "border-box",
						}
			}
		>
			<FragmentContentRenderer fragment={fragment} />
		</div>
	);
}

function PageView({ page }: { page: PageFragment }) {
	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				flexDirection: "column",
				width: page.contentWidth,
				height: page.contentHeight,
				boxSizing: "border-box",
			}}
		>
			{page.fragments.map((frag) => (
				<FragmentRenderer key={frag.id} fragment={frag} />
			))}
		</div>
	);
}

export interface FragmentTreeRendererProps {
	fragmentTree: FragmentTree | null;
	pageContentRef?: React.RefObject<HTMLDivElement | null>;
}

export function FragmentTreeRenderer({ fragmentTree, pageContentRef }: FragmentTreeRendererProps) {
	if (!fragmentTree || fragmentTree.length === 0) {
		return (
			<div className="flex h-full w-full items-center justify-center text-muted-foreground">
				<p>No content to preview</p>
			</div>
		);
	}

	return (
		<div ref={pageContentRef} className="flex flex-col items-center gap-4 overflow-auto p-4">
			{fragmentTree.map((page) => (
				<div
					key={page.pageIndex}
					className="bg-card rounded-xl shadow-sm"
					style={{
						width: page.pageWidthPx,
						height: page.pageHeightPx,
						aspectRatio: String(page.pageWidthPx / page.pageHeightPx),
						paddingTop: 0,
						paddingLeft: 0,
						boxSizing: "border-box",
					}}
				>
					<div
						style={{
							position: "relative",
							width: page.pageWidthPx,
							height: page.pageHeightPx,
							boxSizing: "border-box",
						}}
					>
						<div
							style={{
								position: "absolute",
								left: 0,
								top: 0,
								width: page.contentWidth,
								height: page.contentHeight,
							}}
						>
							<PageView page={page} />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
