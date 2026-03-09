# Resume Builder Layout Algorithm

Design for auto-pagination and PDF export. Layout does **not** reimplement a full browser engine; the **real DOM** is used to measure text and (optionally) boxes. The pipeline has three phases: **layout tree** → **box tree** → **fragment tree** → **renderer** (React or PDF).

---

## 1. Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Layout Tree    │ ──► │   Box Tree      │ ──► │  Fragment Tree  │ ──► │  Renderer       │
│  (template +    │     │  (formatting    │     │  (pagination,   │     │  React | PDF    │
│   data binding) │     │   contexts)     │     │   flow/abs)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Layout tree**: Declarative “where and what” from the template (fixed nodes, repeat nodes, bindings). No geometry.
- **Box tree**: Nested formatting contexts with **sizes** (from measurement or constraints). Input to layout/pagination.
- **Fragment tree**: Same logical content split across **pages**; fragments do not use absolute (x, y) unless the template marks a block as absolutely positioned — otherwise layout uses native CSS. Consumed by ReactRenderer or PDFRenderer.

---

## 2. Layout Tree (existing)

Defined per template. Node kinds:

| Kind         | Role |
|-------------|------|
| `box`       | Container; `children`, optional `unbreakable`. |
| `row`       | Horizontal flow; `children`, `gap`. |
| `column`    | Vertical flow; `columns` (boxes), `gap`. |
| `text`      | Single value; `src: Value<string>`, styles. |
| `rich-text` | Formatted text; `src`, styles. |
| `image`     | Image; `src`, optional `alt`, styles. |
| `repeat`    | Repeats `children` per item from `document[source]` (e.g. `content.experience`); optional `breakable`. |
| `conditional` | Renders `children` only when `condition` is truthy. |

**Values**: `bind(key)` (from `document: Record<string, string>`) or `fixed(value)`.

**Expansion (before box tree)**:

1. **Resolve values**: Replace every `Value<T>` with the actual value from `document` (and tokens).
2. **Expand `repeat`**: For each array item at `source`, instantiate `children` with a scope that maps the item (e.g. `content.experience.0.*`).
3. **Expand `conditional`**: Include or omit subtree based on resolved condition.

Result: a single **expanded layout tree** with only `box`/`row`/`column`/`text`/`rich-text`/`image`, all with resolved content. No more `repeat`/`conditional`/bindings.

---

## 3. Box Tree

The box tree represents **nested formatting contexts** and is the structure we actually lay out and paginate.

### 3.1 Formatting context kinds

- **Block formatting context (BFC)**  
  - Vertical stack.  
  - Used for: root page content, `box` (when block), `column`.  
  - Children are block-level; each has a rectangular region and a vertical extent (height).

- **Inline formatting context (IFC)**  
  - Inline flow (e.g. text lines).  
  - Used for: text runs, inline text inside a block.  
  - We don’t split inside a line; we split at line boundaries (see “Text measurement” below).

- **Flex-like context (row/column)**  
  - Row: horizontal placement with `gap`.  
  - Column: vertical placement with `gap`.  
  - Used for: `row`, `column` nodes.  
  - Sizing: intrinsic (content-based) or constrained by parent; flex can be simplified to “stack with gap” for resume use.

### 3.2 Box tree node (conceptual)

Each node carries:

- **Kind**: block | inline | flex-row | flex-column.
- **Content type**: container | text | image (for measurement and breaking).
- **Resolved styles** (from template + tokens): padding, margin, font, etc.
- **Constraints**: e.g. `maxWidth` from parent (page width minus margins).
- **Computed size** (filled in during layout): `width`, `height`.
- **Children**: for containers; for text, we store the run and later its **line breaks** and **line heights**.
- **Breakability**: from layout node (`unbreakable`, `breakable` on repeat, or default rules).

We do **not** need a full CSS engine: we only need enough to build this tree and then measure/split.

### 3.3 Layout tree → box tree mapping

- `box` → block (or flex-column if we treat it as vertical stack). Preserve `unbreakable`.
- `row` → flex-row; children become flex items (sized by content or constraints).
- `column` → flex-column (or BFC); columns/children stacked with gap.
- `text` → inline content (one or more inline boxes / text runs); may live inside an anonymous block.
- `rich-text` → same as text but with segments (bold, etc.); still measured as lines.
- `image` → replaced block (or inline); width/height from image or style.

All bindings and repeats are already expanded; styles are resolved to numbers/strings (e.g. from `DesignTokens` and `document`).

---

## 4. Measurement (real DOM)

We use the **real DOM** to measure, without implementing a full layout engine.

### 4.1 Text block height

- **Input**: string content, **fixed width** (e.g. page content width), resolved typography (fontSize, fontFamily, lineHeight, etc.).
- **Method**: Create an offscreen container (e.g. `div`) with:
  - `width = fixedWidth` (px),
  - `boxSizing: border-box`,
  - applied typography/padding from resolved style,
  - content set (e.g. `textContent` or `innerHTML` for rich text).
- **Output**: `offsetHeight` (or `getBoundingClientRect().height`) = total height of the text block.

This matches the existing `measureTextHeight(content, width, style)` in `src/lib/dom-utils.ts`. For **pagination**, we also need **line-level** information:

- Either: measure once for full block, then **estimate** line count and line height (e.g. `lineCount = ceil(height / lineHeight)`), and treat “break at line N” as “break at height ≈ N * lineHeight”.
- Or: use a **hidden DOM** with the same width and iterate (e.g. wrap in spans per line or use Range/line metrics) to get exact per-line heights and break positions. Optional optimization.

For the first version, “measure full block height + line-height-based break estimate” is enough.

### 4.2 Images

- **Input**: URL (or base64), optional width/height from style.
- **Output**: width and height (from natural dimensions or style). Load image (or use a cache) and read `naturalWidth`/`naturalHeight`; scale to fit constraints if needed.

### 4.3 Containers (box / row / column)

- **Bottom-up**: children are measured first; then container height = sum of child heights + gaps + padding (and margin if we model it). Width comes from constraint (page width) or max of children (row).
- So: **traverse box tree in dependency order** (e.g. post-order): measure text and images first, then aggregate for containers.

---

## 5. Fragment Tree

The **fragment tree** is the result of **pagination**: the same logical box tree is split into **fragments** that fit on pages.

### 5.1 Positioning model

- **No absolute (x, y) by default**: The fragment tree does **not** assign absolute coordinates `(x, y)` to every fragment. Explicit coordinates are **only** used when the **template** marks a block as having **absolute position** (e.g. a fixed sidebar, overlay, or explicitly positioned element).
- **Native CSS layout otherwise**: For all other blocks, layout uses **native CSS** (block flow, flex, etc.). The fragment tree describes **structure** and **content slices** (what appears on each page, continuation links), and the renderer lays those out with normal flow (e.g. `display: block`, flex containers) — not `position: absolute` + `left`/`top` for every node.
- **When absolute is used**: If the template specifies that a block has absolute position, then that block's fragment(s) carry `(x, y)` (and optionally `width`, `height`) relative to the page content area (or containing block), and the renderer uses `position: absolute` only for those fragments.

### 5.2 Fragment

- A **fragment** is a piece of a box (or text run) that appears on **one page**.
- Each fragment has:
  - **Page index** (0-based).
  - **Position** (only when the template marks the block as absolutely positioned): `x`, `y` (and optionally `width`, `height`) relative to the page content area or containing block. Otherwise these may be omitted or ignored; layout is done via native CSS.
  - **Content**: the slice of the original node (e.g. first 3 lines of a paragraph, or the first part of a column).
  - **Continuation**: optional pointer to the **next fragment** of the same logical node (for “continued on next page”).

### 5.3 Fragment tree structure

- **Page** is the root of a fragment subtree: it has a list of **top-level block fragments**.
- Each block fragment can contain:
  - Inline fragments (text lines),
  - Child block fragments (nested boxes),
  - Or a “continuation” marker that points to the next fragment on the next page.

So the fragment tree is a **forest**: one root per page, each root’s children are the top-level fragments on that page. Fragments that continue on the next page are linked (e.g. `nextFragmentId` or similar).

### 5.4 Flow layout (default)

- **Coordinate-free flow**: For blocks that are **not** marked as absolutely positioned, the renderer does **not** use `(x, y)`. It renders fragments in document order inside a block or flex container, so the browser's normal flow (stacking, wrapping, gap) produces the layout.
- **Containing block**: Block-level fragments stack vertically; inline fragments flow and wrap. No explicit coordinates are required for this.

---

## 6. Pagination Algorithm

**Input**: box tree (with computed sizes), page dimensions (e.g. A4), content rect (page size minus margins).

**Output**: fragment tree (one subtree per page, with positions and continuation links).

### 6.1 Page model

- **Page size**: e.g. A4 (210×297 mm); convert to px using DPI if needed for measurement.
- **Content rect**: `contentTop`, `contentLeft`, `contentWidth`, `contentHeight` from `settings.pageMargins` and `settings.pageSize`.

### 6.2 Break rules

- **Unbreakable box** (`unbreakable: true`): if it doesn’t fit in the remaining page height, move it entirely to the next page (and leave space or allow overflow depending on policy).
- **Breakable box**: can be split; children (or lines) are assigned to current page until `remainingHeight` is exhausted, then the rest go to the next page.
- **Repeat block** (`breakable: true/false`): each repeated item can be treated as a breakable unit (e.g. one experience block can move to next page as a whole, or we break inside it if breakable).
- **Widow/orphan**: optional: avoid single line at bottom of page (widow) or top of next (orphan); can be a second pass or constraint when splitting.

### 6.3 One-pass (simplified) pagination

1. **State**: current page index, current `y` in page content area, `remainingHeight` for current page.
2. **Traverse** box tree in **document order** (pre-order or flow order).
3. For each **block**:
   - If **unbreakable** and block.height > remainingHeight:  
     - Start new page; reset `y`, `remainingHeight`.  
     - Emit fragment for full block on new page; advance `y` by block.height.
   - If **breakable** and block is **text**:
     - Use measured line count and line height (or full height and estimated lines).  
     - Emit fragments for as many lines as fit on current page; then new page and emit the rest. Link fragments with continuation.
   - If **breakable** and block is **container**:
     - Recursively paginate children; when a child crosses the page boundary, split: first part on current page, remainder on next (and possibly more pages). Advance `y` by the height of fragments placed on current page.
4. For **row**: place entire row (or split by row rules: e.g. keep row together or allow breaking between items — resume case often “keep row together”).
5. **New page**: when starting a new page, push a new page root in the fragment tree and reset `remainingHeight` to `contentHeight`, `y` to `contentTop`.

### 6.4 Two-pass (optional)

- **Pass 1**: Build box tree and assign **all** sizes (measure everything).
- **Pass 2**: Run pagination over the box tree with known sizes, producing the fragment tree.

This keeps “measurement” and “splitting” separate and avoids re-measuring when only pagination params (e.g. margins) change.

---

## 7. Data structures (summary)

- **Layout tree**: existing `LayoutNode` (box, row, column, text, rich-text, image, repeat, conditional) with `Value<T>` and `document`.
- **Expanded layout tree**: same node kinds minus repeat/conditional; all values resolved.
- **Box tree**: new type(s); nodes have kind (block | inline | flex-row | flex-column), size (width, height), children or text run + line breaks, breakability.
- **Fragment tree**: **page** nodes, **fragment** nodes (pageIndex, position: "absolute"|"flow", x, y, width, height, content slice, optional nextFragmentId). When position is "flow", renderer uses native CSS; when "absolute", uses (x, y).

---

## 8. Renderers

- **ReactRenderer**: given fragment tree, renders each page as a React subtree; each fragment is positioned (e.g. `position: absolute` or flow in a flex/block container) and displays its content (text, image, nested boxes). Used in preview and possibly in-browser “print”.
- **PDFRenderer**: same fragment tree; draws each fragment at (x, y) in PDF coordinates (e.g. via jsPDF, pdf-lib, or React-PDF). Page size and margins must match the layout step.

Both renderers are **consumer-only**: they do not do layout or measurement; they only consume the fragment tree produced by the layout pipeline.

---

## 9. Implementation order (suggested)

1. **Expand layout tree**: resolve bindings, expand repeat/conditional; keep existing LayoutNode types, add an “expanded” representation or do expansion in place.
2. **Box tree**: define box node types and build box tree from expanded layout tree (resolve styles from tokens + document); no measurement yet.
3. **Measurement**: integrate `measureTextHeight` and container sizing; run measurement pass to fill box tree sizes (fixed width = page content width).
4. **Pagination**: implement one-pass (or two-pass) algorithm; produce fragment tree (pages + positioned fragments).
5. **ReactRenderer**: switch preview to consume fragment tree (one component per page, position fragments inside).
6. **PDFRenderer**: add PDF export that consumes the same fragment tree.

---

## 10. Appendix: A4 and content rect

- A4: 210 mm × 297 mm. At 96 DPI: ~794 × 1123 px (or use 72 DPI for print: 595 × 842 px). Use one convention consistently for both DOM measurement and PDF.
- Content rect: `contentWidth = pageWidth - marginLeft - marginRight`, `contentHeight = pageHeight - marginTop - marginBottom`; origin `(marginLeft, marginTop)`.
