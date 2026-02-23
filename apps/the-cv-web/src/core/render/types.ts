export interface TemplateError {
	path: string;
	message: string;
	nodeKind?: string;
}

export interface RenderContext {
	$parent?: RenderContext;
}
