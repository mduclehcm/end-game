export const DocumentSectionSchema = {
	personal: {
		firstName: "personal.firstName",
		lastName: "personal.lastName",
		title: "personal.title",
		email: "personal.email",
		phone: "personal.phone",
		location: "personal.location",
		postalCode: "personal.postalCode",
		country: "personal.country",
		linkedin: "personal.linkedin",
	},
	summary: {
		text: "summary.text",
	},
	experience: {
		company: "experience.company",
		position: "experience.position",
	},
	education: {
		institution: "education.institution",
		degree: "education.degree",
	},
} as const;

export const DocumentBuiltInSection = ["experience", "education", "skills", "languages", "settings"] as const;

export type DocumentSectionKind = (typeof DocumentBuiltInSection)[number];

export interface DocumentSection {
	kind: DocumentSectionKind;
	order: number;
	draggable?: boolean;
}
