import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentService } from "../resume-data/document.service";
import { debugLog } from "./debug-log";
import type { ObjectStoragePort } from "./export.port";
import { ExportRepository } from "./export.repository";
import { PdfGeneratorService } from "./pdf-generator.service";

const POLL_INTERVAL_MS = 3000;
const BUCKET_ENV = "MINIO_BUCKET";
const DEFAULT_BUCKET = "resume-exports";

@Injectable()
export class ExportWorkerService implements OnModuleInit, OnModuleDestroy {
	private intervalId: ReturnType<typeof setInterval> | null = null;

	constructor(
		private readonly exportRepository: ExportRepository,
		private readonly documentService: DocumentService,
		private readonly pdfGenerator: PdfGeneratorService,
		private readonly configService: ConfigService,
		@Inject("OBJECT_STORAGE") private readonly storage: ObjectStoragePort,
	) {}

	onModuleInit(): void {
		// #region agent log
		const rawEnabled = this.configService.get<string>("EXPORT_WORKER_ENABLED")?.toLowerCase();
		const nodeEnv = this.configService.get<string>("NODE_ENV");
		const defaultInDev = nodeEnv !== "production";
		const explicitTrue = rawEnabled === "true";
		const explicitFalse = rawEnabled === "false";
		const enabled = explicitTrue || (!explicitFalse && defaultInDev);
		const payload1 = {
			sessionId: "298113",
			location: "export-worker.service.ts:onModuleInit",
			message: "Export worker init",
			data: {
				NODE_ENV: nodeEnv,
				EXPORT_WORKER_ENABLED: this.configService.get<string>("EXPORT_WORKER_ENABLED"),
				defaultInDev,
				explicitTrue,
				explicitFalse,
				enabled,
			},
			timestamp: Date.now(),
			hypothesisId: "H1",
		};
		debugLog(payload1);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payload1),
		}).catch(() => {});
		// #endregion
		if (enabled) {
			this.startPolling();
		}
	}

	onModuleDestroy(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	private startPolling(): void {
		this.intervalId = setInterval(() => {
			this.poll().catch((err) => {
				// #region agent log
				const payloadCatch = {
					sessionId: "298113",
					location: "export-worker.service.ts:poll:catch",
					message: "Poll error",
					data: { errorMessage: err instanceof Error ? err.message : String(err) },
					timestamp: Date.now(),
					hypothesisId: "H3",
				};
				debugLog(payloadCatch);
				fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
					method: "POST",
					headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
					body: JSON.stringify(payloadCatch),
				}).catch(() => {});
				// #endregion
				console.error("[ExportWorker] poll error:", err);
			});
		}, POLL_INTERVAL_MS);
	}

	async poll(): Promise<void> {
		// #region agent log
		const payloadEnter = {
			sessionId: "298113",
			location: "export-worker.service.ts:poll:enter",
			message: "Poll started",
			data: {},
			timestamp: Date.now(),
			hypothesisId: "H3",
		};
		debugLog(payloadEnter);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadEnter),
		}).catch(() => {});
		// #endregion
		const job = await this.exportRepository.claimNextPending();
		// #region agent log
		const payloadClaim = {
			sessionId: "298113",
			location: "export-worker.service.ts:poll:after-claim",
			message: "Claim result",
			data: { jobId: job?.id ?? null, hasJob: !!job },
			timestamp: Date.now(),
			hypothesisId: "H2",
		};
		debugLog(payloadClaim);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadClaim),
		}).catch(() => {});
		// #endregion
		if (!job) return;

		const envBucket = this.configService.get<string>(BUCKET_ENV);
		const bucket = envBucket ?? DEFAULT_BUCKET;
		// #region agent log
		const payloadBucket = {
			sessionId: "298113",
			location: "export-worker.service.ts:poll:bucket",
			message: "Bucket resolved for export",
			data: {
				envBucket,
				resolvedBucket: bucket,
				storageAdapter: this.storage.constructor.name,
			},
			timestamp: Date.now(),
			hypothesisId: "H6",
		};
		debugLog(payloadBucket);
		fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
			body: JSON.stringify(payloadBucket),
		}).catch(() => {});
		// #endregion
		if (!bucket) {
			await this.exportRepository.markFailed(job.id, "Object storage not configured (MINIO_BUCKET)");
			return;
		}

		try {
			const document = await this.documentService.findById(job.documentId, job.userId);
			const pdfBuffer = await this.pdfGenerator.generatePdf(document);
			const key = `exports/${job.userId}/${job.id}.pdf`;
			const fileName = `${document.title.replace(/[^a-zA-Z0-9-_.]/g, "_")}.pdf`;

			await this.storage.upload(bucket, key, pdfBuffer, "application/pdf", { fileName });

			await this.exportRepository.markReady(job.id, {
				storageBucket: bucket,
				storageKey: key,
				fileName,
				mimeType: "application/pdf",
				sizeBytes: pdfBuffer.length,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			// #region agent log
			const payloadProcessError = {
				sessionId: "298113",
				location: "export-worker.service.ts:poll:process-catch",
				message: "Export processing failed",
				data: {
					jobId: job.id,
					errorMessage: message,
					resolvedBucket: bucket,
					storageAdapter: this.storage.constructor.name,
				},
				timestamp: Date.now(),
				hypothesisId: "H9",
			};
			debugLog(payloadProcessError);
			fetch("http://127.0.0.1:7529/ingest/2ec749b6-90f1-4a23-a455-c982abf44934", {
				method: "POST",
				headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "298113" },
				body: JSON.stringify(payloadProcessError),
			}).catch(() => {});
			// #endregion
			await this.exportRepository.markFailed(job.id, message);
		}
	}
}
