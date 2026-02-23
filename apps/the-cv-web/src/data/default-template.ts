import type { DocumentTemplate } from "@/core/document";
import { bind, box, fixed, text } from "@/core/document/template-builder";

export const defaultTemplate: DocumentTemplate = {
	id: "default-simple",
	name: "Simple CV",

	tokens: {
		colors: {},
		fonts: {
			title: 25,
		},
		spaces: {
			page: {
				padding: 20,
			},
		},
	},

	layout: box(
		[
			text(bind("content.personal.firstName"), {
				style: {
					fontSize: bind("tokens.fonts.title"),
					fontWeight: fixed("bold"),
				},
			}),
			text(bind("content.personal.lastName"), {
				style: {
					fontSize: bind("tokens.fonts.title"),
					fontWeight: fixed("bold"),
				},
			}),
			text(bind("content.personal.title"), {
				style: {
					fontSize: bind("tokens.fonts.title"),
					fontWeight: fixed("bold"),
				},
			}),
		],
		{
			style: {
				padding: bind("tokens.spaces.page.padding"),
			},
		},
	),
};

const templates: Record<string, DocumentTemplate> = {
	default: defaultTemplate,
};

export function getTemplate(id: string): DocumentTemplate {
	const template = templates[id];
	if (!template) {
		throw new Error(`Unknown template ID: "${id}"`);
	}
	return template;
}
