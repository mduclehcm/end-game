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
		address: "personal.address",
		nationality: "personal.nationality",
		placeOfBirth: "personal.placeOfBirth",
		drivingLicense: "personal.drivingLicense",
		dateOfBirth: "personal.dateOfBirth",
	},
	summary: {
		text: "summary.text",
	},
	experience: {
		company: "experience.company",
		position: "experience.position",
		startDate: "experience.startDate",
		endDate: "experience.endDate",
		location: "experience.location",
		description: "experience.description",
	},
	education: {
		institution: "education.institution",
		degree: "education.degree",
		startDate: "education.startDate",
		endDate: "education.endDate",
		city: "education.city",
		description: "education.description",
	},
} as const;

export const DocumentBuiltInSection = ["experience", "education", "skills", "languages", "settings"] as const;

export type DocumentSectionKind = (typeof DocumentBuiltInSection)[number];

export interface DocumentSection {
	kind: DocumentSectionKind;
	order: number;
	draggable?: boolean;
}
