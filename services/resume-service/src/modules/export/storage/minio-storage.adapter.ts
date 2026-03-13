import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import type { ObjectStoragePort } from "../export.port";

export interface MinioStorageConfig {
	endpoint: string;
	region: string;
	accessKey: string;
	secretKey: string;
	bucket: string;
	forcePathStyle?: boolean;
}

@Injectable()
export class MinioStorageAdapter implements ObjectStoragePort {
	private readonly client: S3Client;
	private readonly bucket: string;

	constructor(config: MinioStorageConfig) {
		this.bucket = config.bucket;
		this.client = new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKey,
				secretAccessKey: config.secretKey,
			},
			forcePathStyle: config.forcePathStyle ?? true,
		});
	}

	async upload(
		bucket: string,
		key: string,
		body: Buffer,
		contentType: string,
		metadata?: { fileName?: string },
	): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
				ContentDisposition: metadata?.fileName
					? `attachment; filename="${metadata.fileName}"`
					: undefined,
			}),
		);
	}

	async getObject(
		bucket: string,
		key: string,
	): Promise<{ body: Buffer; contentType?: string; fileName?: string }> {
		const response = await this.client.send(
			new GetObjectCommand({
				Bucket: bucket,
				Key: key,
			}),
		);
		if (!response.Body) {
			throw new Error("Object body is empty");
		}
		const bytes = await response.Body.transformToByteArray();
		return {
			body: Buffer.from(bytes),
			contentType: response.ContentType,
			fileName: parseFileNameFromContentDisposition(response.ContentDisposition),
		};
	}
}

function parseFileNameFromContentDisposition(contentDisposition?: string): string | undefined {
	if (!contentDisposition) return undefined;
	const match = /filename="([^"]+)"/i.exec(contentDisposition);
	return match?.[1];
}
