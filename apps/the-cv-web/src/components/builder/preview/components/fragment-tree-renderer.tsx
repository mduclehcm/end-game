import { useCallback } from "react";
import type { Fragment, FragmentTree, PageFragment } from "@/core/layout";
import type { ResolvedStyleProps } from "@/core/render/render-tree";
import { spaceBoxToCss } from "@/core/render/render-tree";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store";

function applyResolvedStyle(style: ResolvedStyleProps): React.CSSProperties {
	const s: React.CSSProperties = {};
	if (style.padding != null) s.padding = spaceBoxToCss(style.padding);
	if (style.margin != null) s.margin = spaceBoxToCss(style.margin);
	if (style.fontSize != null) s.fontSize = `${style.fontSize}px`;
	if (style.fontWeight != null) s.fontWeight = String(style.fontWeight);
	if (style.fontFamily != null) s.fontFamily = style.fontFamily;
	if (style.lineHeight != null) s.lineHeight = style.lineHeight;
	if (style.color != null) s.color = style.color;
	if (style.backgroundColor != null) s.backgroundColor = style.backgroundColor;
	return s;
}

interface FragmentContentRendererProps {
	fragment: Fragment;
	activeField: string | null;
	onFieldClick: (dataKey: string) => void;
}

function FragmentContentRenderer({ fragment, activeField, onFieldClick }: FragmentContentRendererProps) {
	const { content } = fragment;
	switch (content.kind) {
		case "text": {
			const { fullContent, lineStart, lineCount, style, isHtml, dataKey } = content;
			const lineHeight = style.lineHeight ?? (style.fontSize ? style.fontSize * 1.2 : 16);
			const heightPx = lineCount * lineHeight;
			const innerStyle = { transform: `translateY(-${lineStart * lineHeight}px)` };
			const isActive = dataKey != null && activeField === dataKey;
			const inner = (
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
			if (dataKey != null) {
				return (
					<div
						role="button"
						tabIndex={0}
						className={cn(
							"cursor-pointer rounded outline-offset-1 transition-shadow focus-visible:outline-2 focus-visible:outline-ring",
							isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
						)}
						style={{ boxSizing: "border-box" }}
						data-data-key={dataKey}
						onClick={(e) => {
							e.stopPropagation();
							onFieldClick(dataKey);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onFieldClick(dataKey);
							}
						}}
					>
						{inner}
					</div>
				);
			}
			return inner;
		}
		case "image": {
			const { src, alt, style, dataKey } = content;
			const isActive = dataKey != null && activeField === dataKey;
			const imgEl = (
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
			if (dataKey != null) {
				return (
					<div
						role="button"
						tabIndex={0}
						className={cn(
							"cursor-pointer rounded outline-offset-1 transition-shadow focus-visible:outline-2 focus-visible:outline-ring",
							isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
						)}
						style={{ boxSizing: "border-box" }}
						data-data-key={dataKey}
						onClick={(e) => {
							e.stopPropagation();
							onFieldClick(dataKey);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onFieldClick(dataKey);
							}
						}}
					>
						{imgEl}
					</div>
				);
			}
			return imgEl;
		}
		case "block": {
			const { children, isRow } = content;
			const useAbsolute = !isRow && fragment.position === "absolute";
			return (
				<div
					style={{
						display: "flex",
						flexDirection: isRow ? "row" : "column",
						width: fragment.width,
						height: fragment.height,
						boxSizing: "border-box",
						position: useAbsolute ? "relative" : undefined,
					}}
				>
					{children.map((child) =>
						isRow ? (
							<div
								key={child.id}
								style={{
									width: child.width,
									height: child.height,
									flexShrink: 0,
									boxSizing: "border-box",
								}}
							>
								<FragmentContentRenderer fragment={child} activeField={activeField} onFieldClick={onFieldClick} />
							</div>
						) : useAbsolute ? (
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
								<FragmentContentRenderer fragment={child} activeField={activeField} onFieldClick={onFieldClick} />
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
								<FragmentContentRenderer fragment={child} activeField={activeField} onFieldClick={onFieldClick} />
							</div>
						),
					)}
				</div>
			);
		}
	}
}

interface FragmentRendererProps {
	fragment: Fragment;
	activeField: string | null;
	onFieldClick: (dataKey: string) => void;
}

function FragmentRenderer({ fragment, activeField, onFieldClick }: FragmentRendererProps) {
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
			<FragmentContentRenderer fragment={fragment} activeField={activeField} onFieldClick={onFieldClick} />
		</div>
	);
}

interface PageViewProps {
	page: PageFragment;
	activeField: string | null;
	onFieldClick: (dataKey: string) => void;
	onBackgroundClick: () => void;
}

function PageView({ page, activeField, onFieldClick, onBackgroundClick }: PageViewProps) {
	return (
		<div
			role="presentation"
			style={{
				position: "relative",
				display: "flex",
				flexDirection: "column",
				width: page.contentWidth,
				height: page.contentHeight,
				boxSizing: "border-box",
			}}
		>
			{/* Click on empty area clears active field */}
			<button
				type="button"
				className="absolute inset-0 cursor-default border-0 bg-transparent p-0"
				aria-label="Clear field selection"
				onClick={onBackgroundClick}
			/>
			{page.fragments.map((frag) => (
				<FragmentRenderer key={frag.id} fragment={frag} activeField={activeField} onFieldClick={onFieldClick} />
			))}
		</div>
	);
}

export interface FragmentTreeRendererProps {
	fragmentTree: FragmentTree | null;
	pageContentRef?: React.RefObject<HTMLDivElement | null>;
	/** Called with the first page content div when mounted; use as measure root so text is measured in the same font context. */
	onFirstPageContentMounted?: (el: HTMLElement | null) => void;
}

export function FragmentTreeRenderer({
	fragmentTree,
	pageContentRef,
	onFirstPageContentMounted,
}: FragmentTreeRendererProps) {
	const activeField = useBuilderStore((state) => state.activeField);
	const setActiveField = useBuilderStore((state) => state.setActiveField);
	const onFieldClick = useCallback(
		(dataKey: string) => {
			setActiveField(dataKey);
		},
		[setActiveField],
	);
	const onBackgroundClick = useCallback(() => {
		setActiveField(null);
	}, [setActiveField]);

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
							ref={page.pageIndex === 0 ? onFirstPageContentMounted : undefined}
							style={{
								position: "absolute",
								left: page.contentLeft,
								top: page.contentTop,
								width: page.contentWidth,
								height: page.contentHeight,
							}}
						>
							<PageView
								page={page}
								activeField={activeField}
								onFieldClick={onFieldClick}
								onBackgroundClick={onBackgroundClick}
							/>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
