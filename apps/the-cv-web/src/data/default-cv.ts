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

	// summary
	"content.summary.text": "A brief summary of your professional background and key strengths.",

	// experience
	"content.experience.0.company": "Company 1",
	"content.experience.0.position": "Software Engineer",
	"content.experience.0.description": "A brief description of your professional background and key strengths.",
	"content.experience.0.startDate": "2020-01-01",
	"content.experience.0.endDate": "2024-01-01",
	"content.experience.0.location": "New York, NY",
	"content.experience.0.postalCode": "10001",
	"content.experience.0.country": "United States",
	"content.experience.0.linkedin": "https://linkedin.com/in/john-doe",

	// education
	"content.education.0.institution": "University 1",
	"content.education.0.degree": "Bachelor of Science",

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
