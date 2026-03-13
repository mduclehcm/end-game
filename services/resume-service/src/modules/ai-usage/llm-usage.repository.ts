import type { LlmUsageLog } from "@algo/cv-core";
import { Inject, Injectable } from "@nestjs/common";
import type { LlmUsageLogPayload, LlmUsageStore } from "@ports";
import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import { shortId } from "../../database/short-id";
import type * as schema from "../../database/schema";
import type { LlmUsageLogInsert, LlmUsageLogRow } from "../../database/schema";
import { LlmUsageLogsTable } from "../../database/schema";

@Injectable()
export class LlmUsageRepository implements LlmUsageStore {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findAll(limit = 100, offset = 0, promptId?: string | null): Promise<LlmUsageLog[]> {
		const rows = promptId
			? await this.db
					.select()
					.from(LlmUsageLogsTable)
					.where(eq(LlmUsageLogsTable.promptId, promptId))
					.orderBy(desc(LlmUsageLogsTable.createdAt))
					.limit(limit)
					.offset(offset)
			: await this.db
					.select()
					.from(LlmUsageLogsTable)
					.orderBy(desc(LlmUsageLogsTable.createdAt))
					.limit(limit)
					.offset(offset);
		return rows.map((r) => this.toDto(r));
	}

	async log(payload: LlmUsageLogPayload): Promise<void> {
		await this.create({
			type: payload.type,
			model: payload.model,
			fieldKey: payload.fieldKey ?? null,
			systemPrompt: payload.systemPrompt,
			userInput: payload.userInput,
			output: payload.output,
			inputTokens: payload.inputTokens,
			outputTokens: payload.outputTokens,
			durationMs: payload.durationMs,
			promptId: payload.promptId ?? null,
			promptUseCaseKey: payload.promptUseCaseKey ?? null,
		});
	}

	async create(data: Omit<LlmUsageLogInsert, "id">): Promise<LlmUsageLogRow> {
		const [row] = await this.db
			.insert(LlmUsageLogsTable)
			.values({
				id: shortId(10),
				...data,
			})
			.returning();
		if (!row) {
			throw new Error("LlmUsageRepository.create: no row returned");
		}
		return row;
	}

	private toDto(r: LlmUsageLogRow): LlmUsageLog {
		return {
			id: r.id,
			type: r.type,
			model: r.model,
			fieldKey: r.fieldKey ?? null,
			systemPrompt: r.systemPrompt,
			userInput: r.userInput,
			output: r.output,
			inputTokens: r.inputTokens,
			outputTokens: r.outputTokens,
			durationMs: r.durationMs,
			promptId: r.promptId ?? null,
			promptUseCaseKey: r.promptUseCaseKey ?? null,
			createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
		};
	}
}
