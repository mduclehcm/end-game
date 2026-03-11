import type { LlmUsageLog } from "@algo/cv-core";
import { Inject, Injectable } from "@nestjs/common";
import type { LlmUsageLogPayload, LlmUsageStore } from "@ports";
import { desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import type { LlmUsageLogInsert, LlmUsageLogRow } from "../../database/schema";
import { LlmUsageLogsTable } from "../../database/schema";

@Injectable()
export class LlmUsageRepository implements LlmUsageStore {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findAll(limit = 100, offset = 0): Promise<LlmUsageLog[]> {
		const rows = await this.db
			.select()
			.from(LlmUsageLogsTable)
			.orderBy(desc(LlmUsageLogsTable.createdAt))
			.limit(limit)
			.offset(offset);
		return rows.map((r) => ({
			...r,
			createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
		}));
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
		});
	}

	async create(data: Omit<LlmUsageLogInsert, "id">): Promise<LlmUsageLogRow> {
		const { nanoid } = await import("nanoid");
		const [row] = await this.db
			.insert(LlmUsageLogsTable)
			.values({
				id: nanoid(10),
				...data,
			})
			.returning();
		if (!row) {
			throw new Error("LlmUsageRepository.create: no row returned");
		}
		return row;
	}
}
