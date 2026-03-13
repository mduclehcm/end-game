import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { DocumentService } from "../resume-data/document.service";
import { hashToken, ExportService } from "./export.service";
import { ExportRepository } from "./export.repository";

describe("hashToken", () => {
	it("returns deterministic sha256 hex", () => {
		const a = hashToken("foo");
		const b = hashToken("foo");
		expect(a).toBe(b);
		expect(a).toMatch(/^[a-f0-9]{64}$/);
	});

	it("different input produces different hash", () => {
		expect(hashToken("a")).not.toBe(hashToken("b"));
	});
});

describe("ExportService", () => {
	let service: ExportService;
	let exportRepository: jest.Mocked<Pick<ExportRepository, "create" | "findById" | "createDownloadToken">>;
	let documentService: jest.Mocked<Pick<DocumentService, "findById">>;
	let storage: { upload: jest.Mock; getObject: jest.Mock };

	beforeEach(async () => {
		exportRepository = {
			create: jest.fn(),
			findById: jest.fn(),
			createDownloadToken: jest.fn(),
		};
		documentService = {
			findById: jest.fn(),
		};
		storage = {
			upload: jest.fn(),
			getObject: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ExportService,
				{
					provide: ExportRepository,
					useValue: exportRepository,
				},
				{
					provide: DocumentService,
					useValue: documentService,
				},
				{
					provide: "OBJECT_STORAGE",
					useValue: storage,
				},
			],
		}).compile();

		service = module.get(ExportService);
	});

	describe("createDownloadLink", () => {
		it("throws NotFound when export does not exist", async () => {
			(exportRepository.findById as jest.Mock).mockResolvedValue(null);
			await expect(service.createDownloadLink("ex1", "user1")).rejects.toThrow(NotFoundException);
		});

		it("throws BadRequest when export is not ready", async () => {
			(exportRepository.findById as jest.Mock).mockResolvedValue({
				id: "ex1",
				userId: "user1",
				status: "pending",
				storageKey: null,
				storageBucket: null,
			});
			await expect(service.createDownloadLink("ex1", "user1")).rejects.toThrow(BadRequestException);
		});

		it("returns downloadUrl and expiresInSeconds when ready", async () => {
			(exportRepository.findById as jest.Mock).mockResolvedValue({
				id: "ex1",
				userId: "user1",
				status: "ready",
				storageKey: "key",
				storageBucket: "bucket",
			});
			(exportRepository.createDownloadToken as jest.Mock).mockResolvedValue(undefined);

			const result = await service.createDownloadLink("ex1", "user1");

			expect(result.downloadUrl).toContain("/api/resume/export-download?exportId=ex1&token=");
			expect(result.expiresInSeconds).toBe(120);
			expect(exportRepository.createDownloadToken).toHaveBeenCalledWith(
				"ex1",
				"user1",
				expect.any(String),
				expect.any(Date),
			);
		});
	});
});
