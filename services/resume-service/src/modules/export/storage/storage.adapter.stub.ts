import type { ObjectStoragePort } from "../export.port";

/**
 * Stub implementation. Replaced by MinioStorageAdapter when MinIO is configured.
 */
export class StubStorageAdapter implements ObjectStoragePort {
	async upload(): Promise<void> {
		throw new Error("Object storage not configured");
	}

	async getObject(): Promise<{ body: Buffer; contentType?: string; fileName?: string }> {
		throw new Error("Object storage not configured");
	}
}
