import { Inject, Injectable } from "@nestjs/common";
import { desc } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import type { LlmUsageLogInsert, LlmUsageLogRow } from "../../database/schema";
import { LlmUsageLogsTable } from "../../database/schema";

@Injectable()
export class LlmUsageRepository {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async findAll(limit = 100, offset = 0): Promise<LlmUsageLogRow[]> {
		return this.db
			.select()
			.from(LlmUsageLogsTable)
			.orderBy(desc(LlmUsageLogsTable.createdAt))
			.limit(limit)
			.offset(offset);
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
