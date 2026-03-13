import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RequireUserGuard } from "../../guards/require-user.guard";
import { DocumentModule } from "../resume-data/document.module";
import { debugLog } from "./debug-log";
import { ExportController, ExportDownloadPublicController } from "./export.controller";
import type { ObjectStoragePort } from "./export.port";
import { ExportRepository } from "./export.repository";
import { ExportService } from "./export.service";
import { ExportWorkerService } from "./export-worker.service";
import { PdfGeneratorService } from "./pdf-generator.service";
import { MinioStorageAdapter } from "./storage/minio-storage.adapter";
import { StubStorageAdapter } from "./storage/storage.adapter.stub";

const DEFAULT_BUCKET = "resume-exports";

function createStorageAdapter(configService: ConfigService): ObjectStoragePort {
	const endpoint = configService.get<string>("MINIO_ENDPOINT");
	const accessKey = configService.get<string>("MINIO_ACCESS_KEY");
	const secretKey = configService.get<string>("MINIO_SECRET_KEY");
	const bucket = configService.get<string>("MINIO_BUCKET") ?? DEFAULT_BUCKET;
	// #region agent log
	debugLog({
		sessionId: "298113",
		location: "export.module.ts:createStorageAdapter",
		message: "Storage adapter env resolved",
		data: {
			hasEndpoint: !!endpoint,
			hasAccessKey: !!accessKey,
			hasSecretKey: !!secretKey,
			bucket,
		},
		timestamp: Date.now(),
		hypothesisId: "H7",
	});
	// #endregion
	if (endpoint && accessKey && secretKey && bucket) {
		// #region agent log
		debugLog({
			sessionId: "298113",
			location: "export.module.ts:createStorageAdapter",
			message: "Using MinioStorageAdapter",
			data: { bucket },
			timestamp: Date.now(),
			hypothesisId: "H7",
		});
		// #endregion
		return new MinioStorageAdapter({
			endpoint,
			region: configService.get<string>("MINIO_REGION") ?? "us-east-1",
			accessKey,
			secretKey,
			bucket,
			forcePathStyle: configService.get<string>("MINIO_FORCE_PATH_STYLE") !== "false",
		});
	}
	// #region agent log
	debugLog({
		sessionId: "298113",
		location: "export.module.ts:createStorageAdapter",
		message: "Using StubStorageAdapter",
		data: {},
		timestamp: Date.now(),
		hypothesisId: "H7",
	});
	// #endregion
	return new StubStorageAdapter();
}

@Module({
	imports: [DocumentModule],
	controllers: [ExportController, ExportDownloadPublicController],
	providers: [
		ExportService,
		ExportRepository,
		ExportWorkerService,
		PdfGeneratorService,
		RequireUserGuard,
		{ provide: "OBJECT_STORAGE", useFactory: createStorageAdapter, inject: [ConfigService] },
	],
	exports: [ExportService, ExportRepository],
})
export class ExportModule {}
