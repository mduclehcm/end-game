import type { DocumentTemplate } from "./document/document-template.js";
import {
	bind,
	box,
	computed,
	conditional,
	fixed,
	repeat,
	richText,
	row,
	text,
	token,
} from "./document/template-builder.js";

function sectionHeading(label: string) {
	return text(fixed(label), {
		style: {
			fontSize: token("fonts.section"),
			fontWeight: fixed("bold"),
			textTransform: fixed("uppercase" as const),
			margin: fixed({ top: 12, bottom: 0, left: 0, right: 0 }),
			color: token("colors.accent"),
		},
	});
}

export const defaultTemplate: DocumentTemplate = {
	id: "default-simple",
	name: "Professional CV",

	tokens: {
		colors: {
			text: "#1a1a1a",
			muted: "#555",
			accent: "#2563eb",
		},
		fonts: {
			title: 24,
			subtitle: 14,
			body: 11,
			small: 10,
			section: 14,
		},
		spaces: {
			small: 8,
			page: {
				padding: 56,
			},
		},
	},

	layout: box(
		[
			box([
				box([
					text(computed([bind("content.personal.firstName"), fixed(" "), bind("content.personal.lastName")]), {
						style: {
							fontSize: token("fonts.title"),
							fontWeight: fixed("bold"),
							color: token("colors.text"),
						},
					}),
				]),
				text(bind("content.personal.title"), {
					style: {
						fontSize: token("fonts.subtitle"),
						color: token("colors.muted"),
					},
				}),
				row(
					[
						conditional(bind("content.personal.email"), [
							text(bind("content.personal.email"), {
								style: {
									fontSize: token("fonts.small"),
									color: token("colors.muted"),
								},
							}),
						]),
						conditional(bind("content.personal.phone"), [
							text(bind("content.personal.phone"), {
								style: {
									fontSize: token("fonts.small"),
									color: token("colors.muted"),
								},
							}),
						]),
						conditional(bind("content.personal.location"), [
							text(bind("content.personal.location"), {
								style: {
									fontSize: token("fonts.small"),
									color: token("colors.muted"),
								},
							}),
						]),
					],
					{ style: { gap: token("spaces.small") } },
				),
			]),

			conditional(bind("content.summary.text"), [
				sectionHeading("Professional Summary"),
				richText(bind("content.summary.text"), {
					style: {
						fontSize: token("fonts.body"),
						lineHeight: fixed(1.45),
						color: token("colors.text"),
					},
				}),
			]),

			conditional(bind("content.experience._hasItems"), [
				sectionHeading("Experience"),
				repeat(
					"content.experience",
					[
						box([
							row(
								[
									text(bind("content.experience.0.position"), {
										style: {
											fontSize: token("fonts.body"),
											fontWeight: fixed("bold"),
											color: token("colors.text"),
										},
									}),
									text(fixed(" — "), {
										style: { fontSize: token("fonts.body"), color: token("colors.muted") },
									}),
									text(bind("content.experience.0.company"), {
										style: {
											fontSize: token("fonts.body"),
											color: token("colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							row(
								[
									text(bind("content.experience.0.startDate"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
									text(fixed(" – "), {
										style: { fontSize: token("fonts.small"), color: token("colors.muted") },
									}),
									text(bind("content.experience.0.endDate"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
									text(fixed(" · "), {
										style: { fontSize: token("fonts.small"), color: token("colors.muted") },
									}),
									text(bind("content.experience.0.location"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							richText(bind("content.experience.0.description"), {
								style: {
									fontSize: token("fonts.body"),
									lineHeight: fixed(1.4),
									color: token("colors.text"),
								},
							}),
						]),
					],
					{ breakable: true },
				),
			]),

			conditional(bind("content.education._hasItems"), [
				sectionHeading("Education"),
				repeat(
					"content.education",
					[
						box([
							row(
								[
									text(bind("content.education.0.degree"), {
										style: {
											fontSize: token("fonts.body"),
											fontWeight: fixed("bold"),
											color: token("colors.text"),
										},
									}),
									text(fixed(" — "), {
										style: { fontSize: token("fonts.body"), color: token("colors.muted") },
									}),
									text(bind("content.education.0.institution"), {
										style: {
											fontSize: token("fonts.body"),
											color: token("colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							row(
								[
									text(bind("content.education.0.startDate"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
									text(fixed(" – "), {
										style: { fontSize: token("fonts.small"), color: token("colors.muted") },
									}),
									text(bind("content.education.0.endDate"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
									text(fixed(" · "), {
										style: { fontSize: token("fonts.small"), color: token("colors.muted") },
									}),
									text(bind("content.education.0.city"), {
										style: {
											fontSize: token("fonts.small"),
											color: token("colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							conditional(bind("content.education.0.description"), [
								richText(bind("content.education.0.description"), {
									style: {
										fontSize: token("fonts.body"),
										lineHeight: fixed(1.4),
										color: token("colors.text"),
									},
								}),
							]),
						]),
					],
					{ breakable: true },
				),
			]),

			conditional(bind("content.skills._hasItems"), [
				sectionHeading("Skills"),
				repeat(
					"content.skills",
					[
						row(
							[
								text(bind("content.skills.0.skill"), {
									style: {
										fontSize: token("fonts.body"),
										color: token("colors.text"),
									},
								}),
							],
							{ gap: 0 },
						),
					],
					{ breakable: true },
				),
			]),

			conditional(bind("content.languages._hasItems"), [
				sectionHeading("Languages"),
				repeat(
					"content.languages",
					[
						text(bind("content.languages.0.language"), {
							style: {
								fontSize: token("fonts.body"),
								color: token("colors.text"),
							},
						}),
					],
					{ breakable: true },
				),
			]),
		],
		{
			style: {
				padding: token("spaces.page.padding"),
			},
		},
	),
};

const templates: Record<string, DocumentTemplate> = {
	default: defaultTemplate,
	"default-simple": defaultTemplate,
};

export function getTemplate(id: string): DocumentTemplate {
	const template = templates[id];
	if (!template) {
		throw new Error(`Unknown template ID: "${id}"`);
	}
	return template;
}
