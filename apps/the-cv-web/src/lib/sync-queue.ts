import type { DocumentData } from "@algo/cv-core";

const SYNC_QUEUE_KEY = "cv_sync_queue";

export type PendingCreate = {
	tempId: string;
	title: string;
	data: DocumentData;
};

export type PendingUpdate = {
	id: string;
	fields: Record<string, string>;
};

export type PendingDelete = {
	id: string;
};

export type SyncQueue = {
	creates: PendingCreate[];
	updates: PendingUpdate[];
	deletes: PendingDelete[];
};

const emptyQueue: SyncQueue = { creates: [], updates: [], deletes: [] };

function getQueue(): SyncQueue {
	try {
		const raw = localStorage.getItem(SYNC_QUEUE_KEY);
		if (!raw) return emptyQueue;
		const parsed = JSON.parse(raw) as SyncQueue;
		return {
			creates: Array.isArray(parsed.creates) ? parsed.creates : [],
			updates: Array.isArray(parsed.updates) ? parsed.updates : [],
			deletes: Array.isArray(parsed.deletes) ? parsed.deletes : [],
		};
	} catch {
		return emptyQueue;
	}
}

function setQueue(queue: SyncQueue): void {
	localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function getSyncQueue(): SyncQueue {
	return getQueue();
}

export function addPendingCreate(item: PendingCreate): void {
	const q = getQueue();
	q.creates.push(item);
	setQueue(q);
}

export function addPendingUpdate(item: PendingUpdate): void {
	const q = getQueue();
	const existing = q.updates.findIndex((u) => u.id === item.id);
	if (existing >= 0) {
		q.updates[existing] = { id: item.id, fields: { ...q.updates[existing].fields, ...item.fields } };
	} else {
		q.updates.push(item);
	}
	setQueue(q);
}

export function addPendingDelete(id: string): void {
	const q = getQueue();
	q.creates = q.creates.filter((c) => c.tempId !== id);
	q.updates = q.updates.filter((u) => u.id !== id);
	q.deletes.push({ id });
	setQueue(q);
}

export function removePendingCreate(tempId: string): void {
	const q = getQueue();
	q.creates = q.creates.filter((c) => c.tempId !== tempId);
	setQueue(q);
}

export function removePendingUpdate(id: string): void {
	const q = getQueue();
	q.updates = q.updates.filter((u) => u.id !== id);
	setQueue(q);
}

export function removePendingDelete(id: string): void {
	const q = getQueue();
	q.deletes = q.deletes.filter((d) => d.id !== id);
	setQueue(q);
}

export function clearSyncQueue(): void {
	setQueue(emptyQueue);
}

export function hasPendingSync(): boolean {
	const q = getQueue();
	return q.creates.length > 0 || q.updates.length > 0 || q.deletes.length > 0;
}

export function getPendingCreateTempIds(): string[] {
	return getQueue().creates.map((c) => c.tempId);
}
