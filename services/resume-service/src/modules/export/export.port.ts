/**
 * Port for object storage (e.g. MinIO S3-compatible).
 * Implemented by MinioStorageAdapter.
 */
export interface ObjectStoragePort {
	upload(
		bucket: string,
		key: string,
		body: Buffer,
		contentType: string,
		metadata?: { fileName?: string },
	): Promise<void>;

	getObject(
		bucket: string,
		key: string,
	): Promise<{ body: Buffer; contentType?: string; fileName?: string }>;
}
