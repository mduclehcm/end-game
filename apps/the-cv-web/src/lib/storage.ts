import {
	type CreateDocumentPayload,
	type DocumentData,
	type DocumentDetail,
	DocumentDetailSchema,
	type DocumentInfo,
	DocumentInfoListSchema,
	DocumentSource,
} from "@algo/cv-core";
import { nanoid } from "nanoid";
import { Logger } from "./logger";

const LIST_KEY = "cv_list";
const KEY_PREFIX = "cv_";

const logger = new Logger("storage");

function getKey(id: string) {
	return `${KEY_PREFIX}${id}`;
}

export async function getDocumentList(): Promise<DocumentInfo[]> {
	try {
		const raw = localStorage.getItem(LIST_KEY);
		if (!raw) return [];
		return DocumentInfoListSchema.parse(JSON.parse(raw));
	} catch (error) {
		logger.errorObj("failed to get document list", error);
		clearStorage();
		throw error;
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

function setDocumentList(list: DocumentInfo[]) {
	logger.info(`set document list to ${list.length} documents`);
	localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

/** Save or update a document in local storage (mirror from cloud or after sync). Upserts by id. */
export async function saveLocalMirror(doc: DocumentDetail): Promise<void> {
	const key = getKey(doc.id);
	localStorage.setItem(key, JSON.stringify(doc));
	const list = await getDocumentList();
	const info: DocumentInfo = {
		id: doc.id,
		title: doc.title,
		source: doc.source,
		createdAt: doc.createdAt,
		updatedAt: doc.updatedAt,
	};
	const idx = list.findIndex((d) => d.id === doc.id);
	const newList = idx >= 0 ? list.map((d, i) => (i === idx ? info : d)) : [...list, info];
	setDocumentList(newList);
}

/** After syncing an offline-created doc: remove temp id from storage and list, add cloud doc. */
export async function replaceTempIdWithCloudId(tempId: string, cloudDetail: DocumentDetail): Promise<void> {
	localStorage.removeItem(getKey(tempId));
	const list = await getDocumentList();
	const newList = list.filter((d) => d.id !== tempId);
	const info: DocumentInfo = {
		id: cloudDetail.id,
		title: cloudDetail.title,
		source: cloudDetail.source,
		createdAt: cloudDetail.createdAt,
		updatedAt: cloudDetail.updatedAt,
	};
	setDocumentList([...newList, info]);
	localStorage.setItem(getKey(cloudDetail.id), JSON.stringify(cloudDetail));
}

export type SaveDocumentPayload = CreateDocumentPayload & {
	initialData?: DocumentData;
};

export async function saveDocument(payload: SaveDocumentPayload): Promise<DocumentDetail> {
	const id = nanoid(10);
	const now = new Date().toISOString();
	const source = DocumentSource.Local;
	const key = getKey(id);
	logger.info(`saving document ${payload.title} to ${key}`);
	const data: DocumentData = payload.initialData ?? {
		sectionIds: [],
		sections: [],
		fieldValues: {},
	};
	const documentDetail: DocumentDetail = {
		id,
		title: payload.title,
		source,
		createdAt: now,
		updatedAt: now,
		data,
	};
	localStorage.setItem(key, JSON.stringify(documentDetail));
	const documentInfo: DocumentInfo = {
		id,
		title: payload.title,
		source,
		createdAt: now,
		updatedAt: now,
	};
	setDocumentList([...(await getDocumentList()), documentInfo]);
	return documentDetail;
}

export async function deleteDocument(id: string): Promise<boolean> {
	logger.info(`deleting document ${id}`);
	localStorage.removeItem(getKey(id));
	const list = await getDocumentList();
	const newList = list.filter((doc) => doc.id !== id);
	setDocumentList(newList);
	return true;
}

export async function updateLocalDocument(id: string, fields: Record<string, string>): Promise<void> {
	const key = getKey(id);
	const raw = localStorage.getItem(key);
	if (!raw) return;
	const doc = JSON.parse(raw) as DocumentDetail;
	doc.data.fieldValues = { ...doc.data.fieldValues, ...fields };
	doc.updatedAt = new Date().toISOString();
	localStorage.setItem(key, JSON.stringify(doc));
}

export async function getDocumentById(id: string): Promise<DocumentDetail | null> {
	try {
		const raw = localStorage.getItem(getKey(id));
		if (!raw) return null;
		return DocumentDetailSchema.parse(JSON.parse(raw));
	} catch (error) {
		logger.errorObj("Failed to get document by id", error);
		deleteDocument(id);
		return null;
	}
}
