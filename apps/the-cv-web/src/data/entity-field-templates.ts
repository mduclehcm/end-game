import type { Field } from "@algo/cv-core";
import { nanoid } from "nanoid";

/** Field definition without id (id is generated when creating an entity). */
export type FieldTemplate = Omit<Field, "id"> & { key: string };

/** Default field definitions per section kind. Used when adding the first entity to a section. */
export const ENTITY_FIELD_TEMPLATES: Record<string, FieldTemplate[]> = {
	personal: [
		{ type: "text", label: "Job Target", placeholder: "", colSpan: 2, key: "title" },
		{ type: "text", label: "First Name", placeholder: "", colSpan: 1, key: "firstName" },
		{ type: "text", label: "Last Name", placeholder: "", colSpan: 1, key: "lastName" },
		{ type: "text", label: "Phone", placeholder: "", colSpan: 1, key: "phone" },
		{ type: "text", label: "Email", placeholder: "", colSpan: 1, key: "email" },
		{ type: "text", label: "LinkedIn", placeholder: "", colSpan: 1, key: "linkedin" },
		{ type: "text", label: "Postal Code", placeholder: "", colSpan: 1, key: "postalCode" },
		{ type: "text", label: "Location", placeholder: "", colSpan: 1, key: "location" },
		{ type: "text", label: "Country", placeholder: "", colSpan: 1, key: "country" },
		{ type: "text", label: "Address", placeholder: "", colSpan: 2, key: "address" },
		{ type: "text", label: "Nationality", placeholder: "", colSpan: 1, key: "nationality" },
		{ type: "text", label: "Place Of Birth", placeholder: "", colSpan: 1, key: "placeOfBirth" },
		{ type: "text", label: "Driving License", placeholder: "", colSpan: 1, key: "drivingLicense" },
		{ type: "text", label: "Date Of Birth", placeholder: "YYYY-MM-DD", colSpan: 1, key: "dateOfBirth" },
	],
	summary: [{ type: "richtext", label: "Summary", placeholder: "", colSpan: 2, key: "text" }],
	settings: [
		{ type: "text", label: "Template", placeholder: "", colSpan: 1, key: "templateId" },
		{ type: "text", label: "Page Size", placeholder: "", colSpan: 1, key: "pageSize" },
		{ type: "text", label: "Margin Top", placeholder: "", colSpan: 1, key: "pageMargins.top" },
		{ type: "text", label: "Margin Right", placeholder: "", colSpan: 1, key: "pageMargins.right" },
		{ type: "text", label: "Margin Bottom", placeholder: "", colSpan: 1, key: "pageMargins.bottom" },
		{ type: "text", label: "Margin Left", placeholder: "", colSpan: 1, key: "pageMargins.left" },
	],
	experience: [
		{ type: "text", label: "Job Title", placeholder: "", colSpan: 2, key: "position" },
		{ type: "text", label: "Employer", placeholder: "", colSpan: 2, key: "company" },
		{ type: "text", label: "Start Date", placeholder: "YYYY-MM-DD", colSpan: 1, key: "startDate" },
		{ type: "text", label: "End Date", placeholder: "YYYY-MM-DD", colSpan: 1, key: "endDate" },
		{ type: "text", label: "City, State", placeholder: "", colSpan: 2, key: "location" },
		{
			type: "richtext",
			label: "Description",
			placeholder: "Bullet points, achievements…",
			colSpan: 2,
			key: "description",
		},
	],
	education: [
		{ type: "text", label: "School", placeholder: "", colSpan: 2, key: "institution" },
		{ type: "text", label: "Degree", placeholder: "", colSpan: 2, key: "degree" },
		{ type: "text", label: "Start Date", placeholder: "YYYY-MM-DD", colSpan: 1, key: "startDate" },
		{ type: "text", label: "End Date", placeholder: "YYYY-MM-DD", colSpan: 1, key: "endDate" },
		{ type: "text", label: "City", placeholder: "", colSpan: 2, key: "city" },
		{
			type: "richtext",
			label: "Description",
			placeholder: "Focus areas, achievements…",
			colSpan: 2,
			key: "description",
		},
	],
	skills: [{ type: "text", label: "Skill", placeholder: "", colSpan: 1, key: "skill" }],
	languages: [{ type: "text", label: "Language", placeholder: "", colSpan: 1, key: "language" }],
};

export function createFieldsFromTemplate(templates: FieldTemplate[]): Field[] {
	return templates.map((t) => ({
		...t,
		id: nanoid(10),
	}));
}

export function cloneEntityFields(fields: Field[]): Field[] {
	return fields.map((f) => ({
		...f,
		id: nanoid(10),
	}));
}
