import type { DocumentTemplate } from "@/core/document";
import { bind, box, conditional, fixed, repeat, richText, row, text } from "@/core/document/template-builder";

function sectionHeading(label: string) {
	return text(fixed(label), {
		style: {
			fontSize: bind("tokens.fonts.section"),
			fontWeight: fixed("bold"),
			textTransform: fixed("uppercase" as const),
			margin: fixed(12),
			color: bind("tokens.colors.accent"),
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
			section: 10,
		},
		spaces: {
			page: {
				padding: 24,
			},
		},
	},

	layout: box(
		[
			// Header: name + title
			box(
				[
					row(
						[
							text(bind("content.personal.firstName"), {
								style: {
									fontSize: bind("tokens.fonts.title"),
									fontWeight: fixed("bold"),
									color: bind("tokens.colors.text"),
								},
							}),
							text(fixed(" "), { style: {} }),
							text(bind("content.personal.lastName"), {
								style: {
									fontSize: bind("tokens.fonts.title"),
									fontWeight: fixed("bold"),
									color: bind("tokens.colors.text"),
								},
							}),
						],
						{ gap: 0 },
					),
					text(bind("content.personal.title"), {
						style: {
							fontSize: bind("tokens.fonts.subtitle"),
							color: bind("tokens.colors.muted"),
							margin: fixed(2),
						},
					}),
					// Contact line: email · phone · location
					conditional(bind("content.personal.email"), [
						row(
							[
								text(bind("content.personal.email"), {
									style: {
										fontSize: bind("tokens.fonts.small"),
										color: bind("tokens.colors.muted"),
									},
								}),
								text(fixed(" · "), {
									style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
								}),
								text(bind("content.personal.phone"), {
									style: {
										fontSize: bind("tokens.fonts.small"),
										color: bind("tokens.colors.muted"),
									},
								}),
								text(fixed(" · "), {
									style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
								}),
								text(bind("content.personal.location"), {
									style: {
										fontSize: bind("tokens.fonts.small"),
										color: bind("tokens.colors.muted"),
									},
								}),
							],
							{ gap: 0 },
						),
					]),
				],
				{ style: { margin: fixed(0), padding: fixed(0) } },
			),

			// Professional summary
			conditional(bind("content.summary.text"), [
				sectionHeading("Professional Summary"),
				richText(bind("content.summary.text"), {
					style: {
						fontSize: bind("tokens.fonts.body"),
						lineHeight: fixed(1.45),
						color: bind("tokens.colors.text"),
					},
				}),
			]),

			// Experience
			sectionHeading("Experience"),
			repeat(
				"content.experience",
				[
					box(
						[
							row(
								[
									text(bind("content.experience.0.position"), {
										style: {
											fontSize: bind("tokens.fonts.body"),
											fontWeight: fixed("bold"),
											color: bind("tokens.colors.text"),
										},
									}),
									text(fixed(" — "), {
										style: { fontSize: bind("tokens.fonts.body"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.experience.0.company"), {
										style: {
											fontSize: bind("tokens.fonts.body"),
											color: bind("tokens.colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							row(
								[
									text(bind("content.experience.0.startDate"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
									text(fixed(" – "), {
										style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.experience.0.endDate"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
									text(fixed(" · "), {
										style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.experience.0.location"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							richText(bind("content.experience.0.description"), {
								style: {
									fontSize: bind("tokens.fonts.body"),
									lineHeight: fixed(1.4),
									margin: fixed(4),
									color: bind("tokens.colors.text"),
								},
							}),
						],
						{ style: { margin: fixed(10) } },
					),
				],
				{ breakable: true },
			),

			// Education
			sectionHeading("Education"),
			repeat(
				"content.education",
				[
					box(
						[
							row(
								[
									text(bind("content.education.0.degree"), {
										style: {
											fontSize: bind("tokens.fonts.body"),
											fontWeight: fixed("bold"),
											color: bind("tokens.colors.text"),
										},
									}),
									text(fixed(" — "), {
										style: { fontSize: bind("tokens.fonts.body"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.education.0.institution"), {
										style: {
											fontSize: bind("tokens.fonts.body"),
											color: bind("tokens.colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							row(
								[
									text(bind("content.education.0.startDate"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
									text(fixed(" – "), {
										style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.education.0.endDate"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
									text(fixed(" · "), {
										style: { fontSize: bind("tokens.fonts.small"), color: bind("tokens.colors.muted") },
									}),
									text(bind("content.education.0.city"), {
										style: {
											fontSize: bind("tokens.fonts.small"),
											color: bind("tokens.colors.muted"),
										},
									}),
								],
								{ gap: 0 },
							),
							conditional(bind("content.education.0.description"), [
								richText(bind("content.education.0.description"), {
									style: {
										fontSize: bind("tokens.fonts.body"),
										lineHeight: fixed(1.4),
										margin: fixed(4),
										color: bind("tokens.colors.text"),
									},
								}),
							]),
						],
						{ style: { margin: fixed(10) } },
					),
				],
				{ breakable: true },
			),

			// Skills
			sectionHeading("Skills"),
			repeat(
				"content.skills",
				[
					row(
						[
							text(bind("content.skills.0.skill"), {
								style: {
									fontSize: bind("tokens.fonts.body"),
									color: bind("tokens.colors.text"),
								},
							}),
						],
						{ gap: 0 },
					),
				],
				{ breakable: true },
			),

			// Languages
			sectionHeading("Languages"),
			repeat(
				"content.languages",
				[
					text(bind("content.languages.0.language"), {
						style: {
							fontSize: bind("tokens.fonts.body"),
							color: bind("tokens.colors.text"),
						},
					}),
				],
				{ breakable: true },
			),
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
	"default-simple": defaultTemplate,
};

export function getTemplate(id: string): DocumentTemplate {
	const template = templates[id];
	if (!template) {
		throw new Error(`Unknown template ID: "${id}"`);
	}
	return template;
}
