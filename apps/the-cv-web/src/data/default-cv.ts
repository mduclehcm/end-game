const defaultDocument: Record<string, string> = {
	// personal
	"content.personal.firstName": "Alex",
	"content.personal.lastName": "Chen",
	"content.personal.title": "Senior Software Engineer",
	"content.personal.email": "alex.chen@example.com",
	"content.personal.phone": "+1 (650) 555-0123",
	"content.personal.location": "Mountain View, CA",
	"content.personal.postalCode": "94043",
	"content.personal.country": "United States",
	"content.personal.linkedin": "https://linkedin.com/in/alex-chen-swe",
	"content.personal.address": "",
	"content.personal.nationality": "",
	"content.personal.placeOfBirth": "",
	"content.personal.drivingLicense": "",
	"content.personal.dateOfBirth": "",

	// summary
	"content.summary.text":
		"Senior Software Engineer with 8+ years of experience building large-scale distributed systems. Led projects serving millions of users at Google. Strong in system design, data structures, and cross-team collaboration. Passionate about reliability, performance, and mentoring.",

	// experience: Google (current) + previous role = 8yoe
	"content.experience.0.position": "Senior Software Engineer",
	"content.experience.0.company": "Google",
	"content.experience.0.startDate": "2020",
	"content.experience.0.endDate": "Present",
	"content.experience.0.location": "Mountain View, CA",
	"content.experience.0.description":
		"Design and implement scalable backend services for Google Cloud. Led migration of a critical pipeline to reduce latency by 40%. Mentor junior engineers and drive technical design reviews. Tech: Java, Python, Protocol Buffers, Spanner.",

	"content.experience.1.position": "Software Engineer",
	"content.experience.1.company": "TechCorp",
	"content.experience.1.startDate": "2016",
	"content.experience.1.endDate": "2020",
	"content.experience.1.location": "San Francisco, CA",
	"content.experience.1.description":
		"Built and maintained microservices for real-time analytics. Improved query performance by 3x through indexing and caching. Participated in on-call rotation and incident response.",

	// education
	"content.education.0.institution": "Stanford University",
	"content.education.0.degree": "B.S. Computer Science",
	"content.education.0.startDate": "2012",
	"content.education.0.endDate": "2016",
	"content.education.0.city": "Stanford, CA",
	"content.education.0.description": "Focus in systems and distributed computing. Teaching assistant for Algorithms.",

	// skills
	"content.skills.0.skill": "Java",
	"content.skills.1.skill": "Python",
	"content.skills.2.skill": "C++",
	"content.skills.3.skill": "Distributed Systems",
	"content.skills.4.skill": "System Design",
	"content.skills.5.skill": "SQL",
	"content.skills.6.skill": "Protocol Buffers",

	// languages
	"content.languages.0.language": "English",
	"content.languages.1.language": "Mandarin",

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
