import type { UserDocument } from "@/core/document";
import { Logger } from "./logger";

const LIST_KEY = "cv_list";
const KEY_PREFIX = "cv_";

const logger = new Logger("storage");

export interface DocumentListItem {
	id: string;
	title: string;
	updatedAt: string;
}

function getKey(id: string) {
	return `${KEY_PREFIX}${id}`;
}

function getDocumentList(): string[] {
	try {
		const raw = localStorage.getItem(LIST_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		const result = Array.isArray(parsed) ? parsed : [];
		logger.info(`loaded ${result.length} documents`);
		return result;
	} catch (error) {
		logger.errorObj("Failed to get document list", error);
		clearStorage();
		return [];
	}
}

export function clearStorage(): void {
	logger.info("clearing storage");
	localStorage.removeItem(LIST_KEY);
	for (const key of Object.keys(localStorage)) {
		if (key.startsWith(KEY_PREFIX)) {
			localStorage.removeItem(key);
		}
	}
}

function setDocumentList(ids: string[]) {
	logger.info(`setting document list to ${ids.length} documents`);
	localStorage.setItem(LIST_KEY, JSON.stringify(ids));
}

export function fetchDocumentList(): DocumentListItem[] {
	logger.info("fetching document list");
	const ids = getDocumentList();
	const items: DocumentListItem[] = [];

	for (const id of ids) {
		const userDoc = fetchDocumentDetail(id);
		if (userDoc) {
			items.push({
				id: userDoc.id,
				title: userDoc.title,
				updatedAt: userDoc.updatedAt,
			});
		}
	}

	items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

	return items;
}

export function fetchDocumentDetail(id: string): UserDocument | null {
	try {
		const raw = localStorage.getItem(getKey(id));
		if (!raw) return null;
		return JSON.parse(raw) as UserDocument;
	} catch (error) {
		logger.errorObj("failed to fetch document detail", error);
		deleteDocument(id);
		return null;
	}
}

export function saveDocument(userDoc: UserDocument): void {
	const key = getKey(userDoc.id);
	localStorage.setItem(key, JSON.stringify(userDoc));

	const ids = getDocumentList();
	if (!ids.includes(userDoc.id)) {
		ids.unshift(userDoc.id);
		setDocumentList(ids);
	}
}

export function deleteDocument(id: string): void {
	logger.info(`deleting document ${id}`);
	localStorage.removeItem(getKey(id));
	const ids = getDocumentList().filter((x) => x !== id);
	setDocumentList(ids);
}
