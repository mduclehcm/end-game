import {
	ActivateSystemPromptResponseSchema,
	CreateDocumentResponseSchema,
	CreateSystemPromptResponseSchema,
	DeleteDocumentResponseSchema,
	GetAiUsageResponseSchema,
	GetDocumentListResponseSchema,
	GetDocumentResponseSchema,
	GetSystemPromptsResponseSchema,
	UpdateDocumentResponseSchema,
} from "@algo/cv-core";
import type { INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { X_USER_ID_HEADER } from "../src/guards/require-user.guard";
import { ResumeModule } from "../src/resume.module";
import { runE2eMigrations } from "./run-e2e-migrations";

const TEST_USER_ID = "testuser01";

describe("Resume API (e2e) – contract baselines", () => {
	let app: INestApplication<App>;

	const API = "/api/resume";
	const ADMIN_API = "/api/admin";

	function docRequest() {
		const agent = request(app.getHttpServer());
		return {
			get: (path: string) => agent.get(path).set(X_USER_ID_HEADER, TEST_USER_ID),
			post: (path: string) => agent.post(path).set(X_USER_ID_HEADER, TEST_USER_ID),
			patch: (path: string) => agent.patch(path).set(X_USER_ID_HEADER, TEST_USER_ID),
			delete: (path: string) => agent.delete(path).set(X_USER_ID_HEADER, TEST_USER_ID),
		};
	}

	beforeAll(async () => {
		if (!process.env.DATABASE_URL) {
			process.env.DATABASE_URL = "postgresql://algo:algo@localhost:5432/algo_dev";
		}
		await runE2eMigrations();
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ResumeModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix("api"); // same as main.ts so we test real client paths
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	describe("GET /documents", () => {
		it("returns list response matching contract", async () => {
			const res = await docRequest().get(`${API}/documents`).expect(200);
			const parsed = GetDocumentListResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(Array.isArray(parsed.data.data)).toBe(true);
		});
	});

	describe("GET /ai-usage", () => {
		it("returns ai-usage response matching contract", async () => {
			const res = await request(app.getHttpServer()).get(`${ADMIN_API}/ai-usage`).expect(200);
			const parsed = GetAiUsageResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(Array.isArray(parsed.data.data)).toBe(true);
		});

		it("accepts limit and offset query params without NaN", async () => {
			const res = await request(app.getHttpServer())
				.get(`${ADMIN_API}/ai-usage`)
				.query({ limit: "50", offset: "0" })
				.expect(200);
			const parsed = GetAiUsageResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("handles invalid limit/offset gracefully", async () => {
			const res = await request(app.getHttpServer())
				.get(`${ADMIN_API}/ai-usage`)
				.query({ limit: "not-a-number", offset: "nope" })
				.expect(200);
			expect(res.body).toHaveProperty("data");
			expect(Array.isArray(res.body.data)).toBe(true);
		});

		it("accepts promptId filter and returns matching contract", async () => {
			const res = await request(app.getHttpServer())
				.get(`${ADMIN_API}/ai-usage`)
				.query({ limit: "10", offset: "0", promptId: "nonexistent-prompt" })
				.expect(200);
			const parsed = GetAiUsageResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) {
				expect(Array.isArray(parsed.data.data)).toBe(true);
				expect(parsed.data.data.length).toBe(0);
			}
		});
	});

	describe("GET /system-prompts", () => {
		it("returns system-prompts response matching contract", async () => {
			const res = await request(app.getHttpServer()).get(`${ADMIN_API}/system-prompts`).expect(200);
			const parsed = GetSystemPromptsResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(Array.isArray(parsed.data.data)).toBe(true);
		});

		it("accepts useCaseKey query param", async () => {
			const res = await request(app.getHttpServer())
				.get(`${ADMIN_API}/system-prompts`)
				.query({ useCaseKey: "parse-resume" })
				.expect(200);
			const parsed = GetSystemPromptsResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});
	});

	describe("POST /system-prompts and PATCH /system-prompts/:id/activate", () => {
		let promptId: string;

		it("POST /system-prompts – create response matches contract", async () => {
			const res = await request(app.getHttpServer())
				.post(`${ADMIN_API}/system-prompts`)
				.send({
					useCaseKey: "parse-resume",
					name: "E2E Test Prompt",
					promptParts: { role: "You are a test parser.", guide: "Extract key fields." },
				})
				.expect(201);
			const parsed = CreateSystemPromptResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) {
				promptId = parsed.data.data.id;
				expect(promptId).toBeDefined();
				expect(parsed.data.data.useCaseKey).toBe("parse-resume");
				expect(parsed.data.data.isActive).toBe(false);
				expect(parsed.data.data.promptParts).toEqual({
					role: "You are a test parser.",
					guide: "Extract key fields.",
				});
				expect(parsed.data.data.promptText).toContain("You are a test parser.");
				expect(parsed.data.data.promptText).toContain("Extract key fields.");
			}
		});

		it("PATCH /system-prompts/:id/activate – response matches contract", async () => {
			if (!promptId) return;
			const res = await request(app.getHttpServer())
				.patch(`${ADMIN_API}/system-prompts/${promptId}/activate`)
				.expect(200);
			const parsed = ActivateSystemPromptResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(parsed.data.data.isActive).toBe(true);
		});

		it("GET /system-prompts/:id – response matches contract", async () => {
			if (!promptId) return;
			const res = await request(app.getHttpServer()).get(`${ADMIN_API}/system-prompts/${promptId}`).expect(200);
			const parsed = CreateSystemPromptResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(parsed.data.data.id).toBe(promptId);
		});

		it("PATCH /system-prompts/:id – update name and promptParts", async () => {
			if (!promptId) return;
			const res = await request(app.getHttpServer())
				.patch(`${ADMIN_API}/system-prompts/${promptId}`)
				.send({
					name: "E2E Updated Name",
					promptParts: { role: "Updated role.", guide: "Updated guide." },
				})
				.expect(200);
			const parsed = CreateSystemPromptResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) {
				expect(parsed.data.data.name).toBe("E2E Updated Name");
				expect(parsed.data.data.promptParts.role).toBe("Updated role.");
				expect(parsed.data.data.promptParts.guide).toBe("Updated guide.");
				expect(parsed.data.data.promptText).toContain("Updated role.");
				expect(parsed.data.data.promptText).toContain("Updated guide.");
			}
		});
	});

	describe("GET /health", () => {
		it("returns 200", async () => {
			await request(app.getHttpServer()).get(`${API}/health`).expect(200);
		});
	});

	describe("Document CRUD – contract baseline", () => {
		let documentId: string;

		it("POST /documents – create response matches contract", async () => {
			const res = await docRequest()
				.post(`${API}/documents`)
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
			const res = await docRequest().get(`${API}/documents/${documentId}`).expect(200);
			const parsed = GetDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("PATCH /documents/:id – update response matches contract", async () => {
			if (!documentId) return;
			const res = await docRequest().patch(`${API}/documents/${documentId}`).send({ title: "E2E Updated" }).expect(200);
			const parsed = UpdateDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
		});

		it("DELETE /documents/:id – delete response matches contract", async () => {
			if (!documentId) return;
			const res = await docRequest().delete(`${API}/documents/${documentId}`).expect(200);
			const parsed = DeleteDocumentResponseSchema.safeParse(res.body);
			expect(parsed.success).toBe(true);
			if (parsed.success) expect(parsed.data.success).toBe(true);
		});
	});

	describe("GET /documents/:id – 404 for missing", () => {
		it("returns 404 for non-existent id", async () => {
			await docRequest().get(`${API}/documents/nonexistent1`).expect(404);
		});

		it("returns 401 without X-User-Id header", async () => {
			await request(app.getHttpServer()).get(`${API}/documents`).expect(401);
		});
	});
});
