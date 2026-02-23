export interface UserDocument {
	id: string;
	title: string;
	fields: Record<string, string>;
	createdAt: string;
	updatedAt: string;
}
