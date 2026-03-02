const defaultDocument: Record<string, string> = {
	// personal
	"content.personal.firstName": "John",
	"content.personal.lastName": "Doe",
	"content.personal.title": "Software Engineer",
	"content.personal.email": "john.doe@example.com",
	"content.personal.phone": "+1234567890",
	"content.personal.location": "New York, NY",
	"content.personal.postalCode": "10001",
	"content.personal.country": "United States",
	"content.personal.linkedin": "https://linkedin.com/in/john-doe",
	"content.personal.address": "",
	"content.personal.nationality": "",
	"content.personal.placeOfBirth": "",
	"content.personal.drivingLicense": "",
	"content.personal.dateOfBirth": "",

	// summary
	"content.summary.text": "A brief summary of your professional background and key strengths.",

	// experience (array: one empty item by default)
	"content.experience.0.position": "",
	"content.experience.0.company": "",
	"content.experience.0.startDate": "",
	"content.experience.0.endDate": "",
	"content.experience.0.location": "",
	"content.experience.0.description": "",

	// education (array: one empty item by default)
	"content.education.0.institution": "",
	"content.education.0.degree": "",
	"content.education.0.startDate": "",
	"content.education.0.endDate": "",
	"content.education.0.city": "",
	"content.education.0.description": "",

	// skills
	"content.skills.0.skill": "JavaScript",
	"content.skills.1.skill": "TypeScript",

	// languages
	"content.languages.0.language": "English",
	"content.languages.1.language": "Spanish",

	// settings
	"settings.templateId": "default-simple",

	"settings.pageSize": "A4",

	"settings.pageMargins.top": "20",
	"settings.pageMargins.right": "20",
	"settings.pageMargins.bottom": "20",
	"settings.pageMargins.left": "20",
};

export function getDefaultDocument(): Record<string, string> {
	return {
		...defaultDocument,
	};
}
