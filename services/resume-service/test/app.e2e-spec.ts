import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import {
	CreateDocumentResponseSchema,
	DeleteDocumentResponseSchema,
	GetAiUsageResponseSchema,
	GetDocumentListResponseSchema,
	GetDocumentResponseSchema,
	UpdateDocumentResponseSchema,
} from "../src/api-contracts";
import { ResumeModule } from "../src/resume.module";

describe("Resume API (e2e) – contract baselines", () => {
	let app: INestApplication<App>;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ResumeModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	describe("GET /documents", () => {
		it("returns list response matching contract", async () => {
			const res = await request(app.getHttpServer()).get("/documents").expect(200);
			const parsed = GetDocumentListResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(Array.isArray(parsed.data.data)).toBe(true);
		});
	});

	describe("GET /ai-usage", () => {
		it("returns ai-usage response matching contract", async () => {
			const res = await request(app.getHttpServer()).get("/ai-usage").expect(200);
			const parsed = GetAiUsageResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(Array.isArray(parsed.data.data)).toBe(true);
		});

		it("accepts limit and offset query params without NaN", async () => {
			const res = await request(app.getHttpServer()).get("/ai-usage").query({ limit: "50", offset: "0" }).expect(200);
			const parsed = GetAiUsageResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("handles invalid limit/offset gracefully", async () => {
			const res = await request(app.getHttpServer())
				.get("/ai-usage")
				.query({ limit: "not-a-number", offset: "nope" })
				.expect(200);
			expect(res.body).toHaveProperty("data");
			expect(Array.isArray(res.body.data)).toBe(true);
		});
	});

	describe("GET /health", () => {
		it("returns 200", async () => {
			await request(app.getHttpServer()).get("/health").expect(200);
		});
	});

	describe("Document CRUD – contract baseline", () => {
		let documentId: string;

		it("POST /documents – create response matches contract", async () => {
			const res = await request(app.getHttpServer())
				.post("/documents")
				.send({ title: "E2E Contract Test", fieldValues: {} })
				.expect(201);
			const parsed = CreateDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) {
				documentId = parsed.data.data.id;
				expect(documentId).toBeDefined();
			}
		});

		it("GET /documents/:id – get response matches contract", async () => {
			if (!documentId) return;
			const res = await request(app.getHttpServer()).get(`/documents/${documentId}`).expect(200);
			const parsed = GetDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("PATCH /documents/:id – update response matches contract", async () => {
			if (!documentId) return;
			const res = await request(app.getHttpServer())
				.patch(`/documents/${documentId}`)
				.send({ title: "E2E Updated" })
				.expect(200);
			const parsed = UpdateDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("DELETE /documents/:id – delete response matches contract", async () => {
			if (!documentId) return;
			const res = await request(app.getHttpServer()).delete(`/documents/${documentId}`).expect(200);
			const parsed = DeleteDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(parsed.data.success).toBe(true);
		});
	});

	describe("GET /documents/:id – 404 for missing", () => {
		it("returns 404 for non-existent id", async () => {
			await request(app.getHttpServer()).get("/documents/nonexistent1").expect(404);
		});
	});
});
