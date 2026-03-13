import type {
	Fragment,
	FragmentBlockContent,
	FragmentImageContent,
	FragmentTextContent,
	FragmentTree,
	PageFragment,
	ResolvedStyleProps,
	SpaceBox,
} from "@algo/cv-layout";

function spaceBoxToCss(box: SpaceBox): string {
	return `${box.top}px ${box.right}px ${box.bottom}px ${box.left}px`;
}

function styleToCss(style: ResolvedStyleProps): string {
	const parts: string[] = ["box-sizing:border-box"];
	if (style.padding != null) parts.push(`padding:${spaceBoxToCss(style.padding)}`);
	if (style.margin != null) parts.push(`margin:${spaceBoxToCss(style.margin)}`);
	if (style.fontSize != null) parts.push(`font-size:${style.fontSize}px`);
	if (style.fontWeight != null) parts.push(`font-weight:${style.fontWeight}`);
	if (style.fontFamily != null) parts.push(`font-family:${style.fontFamily}`);
	if (style.lineHeight != null)
		parts.push(`line-height:${typeof style.lineHeight === "number" ? style.lineHeight : style.lineHeight}`);
	if (style.color != null) parts.push(`color:${style.color}`);
	if (style.backgroundColor != null) parts.push(`background-color:${style.backgroundColor}`);
	return parts.join(";");
}

/** Style for fragment wrapper: no margin (layout already reserves that space); use margin as padding so content is inset. */
function wrapperStyleToCss(style: ResolvedStyleProps): string {
	const parts: string[] = ["box-sizing:border-box"];
	if (style.margin != null) parts.push(`padding:${spaceBoxToCss(style.margin)}`);
	return parts.join(";");
}

/** Like styleToCss but without margin (use when margin was already applied as wrapper padding). */
function styleToCssNoMargin(style: ResolvedStyleProps): string {
	const parts: string[] = ["box-sizing:border-box"];
	if (style.padding != null) parts.push(`padding:${spaceBoxToCss(style.padding)}`);
	if (style.fontSize != null) parts.push(`font-size:${style.fontSize}px`);
	if (style.fontWeight != null) parts.push(`font-weight:${style.fontWeight}`);
	if (style.fontFamily != null) parts.push(`font-family:${style.fontFamily}`);
	if (style.lineHeight != null)
		parts.push(`line-height:${typeof style.lineHeight === "number" ? style.lineHeight : style.lineHeight}`);
	if (style.textTransform != null) parts.push(`text-transform:${style.textTransform}`);
	if (style.color != null) parts.push(`color:${style.color}`);
	if (style.backgroundColor != null) parts.push(`background-color:${style.backgroundColor}`);
	return parts.join(";");
}

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderFragment(frag: Fragment, offsetX = 0, offsetY = 0): string {
	const left = frag.x - offsetX;
	const top = frag.y - offsetY;
	const pos = `position:absolute;left:${left}px;top:${top}px;width:${frag.width}px;height:${frag.height}px`;

	switch (frag.content.kind) {
		case "text": {
			const c = frag.content as FragmentTextContent;
			const wrapperStyle = `${pos};${wrapperStyleToCss(c.style)}`;
			const lineHeight = c.style.lineHeight ?? (c.style.fontSize ? c.style.fontSize * 1.2 : 16);
			const heightPx = c.lineCount * lineHeight;
			const innerStyle = `transform:translateY(-${c.lineStart * lineHeight}px);${styleToCssNoMargin(c.style)}`;
			const inner = c.isHtml
				? `<div style="height:${heightPx}px;overflow:hidden;${innerStyle}">${c.fullContent}</div>`
				: `<div style="height:${heightPx}px;overflow:hidden;${innerStyle}">${escapeHtml(c.fullContent)}</div>`;
			return `<div style="${wrapperStyle}">${inner}</div>`;
		}
		case "image": {
			const c = frag.content as FragmentImageContent;
			const wrapperStyle = `${pos};${wrapperStyleToCss(c.style)}`;
			const alt = c.alt != null ? escapeHtml(c.alt) : "";
			return `<div style="${wrapperStyle}"><img src="${escapeHtml(c.src)}" alt="${alt}" style="display:block;width:${frag.width}px;height:${frag.height}px;object-fit:contain;${styleToCssNoMargin(c.style)}" /></div>`;
		}
		case "block": {
			const c = frag.content as FragmentBlockContent;
			const style = `${pos};${styleToCss({})}`;
			const children = c.children.map((ch) => renderFragment(ch, frag.x, frag.y)).join("");
			return `<div style="${style};display:flex;flex-direction:${c.isRow ? "row" : "column"}">${children}</div>`;
		}
	}
}

function renderPage(page: PageFragment): string {
	// Fragment coordinates from the layout pipeline are in page space; convert to content-relative
	// so we don't double-apply contentLeft/contentTop (the content wrapper is already offset).
	const offsetX = page.contentLeft;
	const offsetY = page.contentTop;
	return `
<div class="page" style="position:relative;width:${page.pageWidthPx}px;height:${page.pageHeightPx}px;background:white;">
  <div style="position:absolute;left:${page.contentLeft}px;top:${page.contentTop}px;width:${page.contentWidth}px;height:${page.contentHeight}px;">
    ${page.fragments.map((f) => renderFragment(f, offsetX, offsetY)).join("\n    ")}
  </div>
</div>`;
}

/**
 * Render a fragment tree to a full HTML document suitable for headless browser print-to-PDF.
 */
export function fragmentTreeToHtml(fragmentTree: FragmentTree, options?: { title?: string }): string {
	const title = options?.title != null ? escapeHtml(options.title) : "Resume";
	const pagesHtml = fragmentTree.map((p) => renderPage(p)).join("\n");
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; }
    .page { margin: 0 auto 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
${pagesHtml}
</body>
</html>`;
}
