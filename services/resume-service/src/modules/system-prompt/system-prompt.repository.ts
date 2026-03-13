import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DRIZZLE } from "../../database/database.provider";
import type * as schema from "../../database/schema";
import {
	buildPromptText,
	type SystemPromptInsert,
	type SystemPromptRow,
	SystemPromptsTable,
} from "../../database/schema";
import { shortId } from "../../database/short-id";

export interface SystemPromptDto {
	id: string;
	useCaseKey: string;
	name: string;
	/** Final prompt = role + guide (concatenated). Output structure is injected by backend per use case. */
	promptText: string;
	/** Editable parts: role, guide. */
	promptParts: { role: string; guide: string };
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSystemPromptDto {
	useCaseKey: string;
	name: string;
	promptParts: { role?: string; guide?: string };
}

@Injectable()
export class SystemPromptRepository {
	constructor(@Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>) {}

	async create(data: Omit<SystemPromptInsert, "id">): Promise<SystemPromptRow> {
		const [row] = await this.db
			.insert(SystemPromptsTable)
			.values({
				id: shortId(10),
				...data,
			})
			.returning();
		if (!row) throw new Error("SystemPromptRepository.create: no row returned");
		return row;
	}

	async findAll(useCaseKey?: string): Promise<SystemPromptDto[]> {
		const base = this.db.select().from(SystemPromptsTable);
		const rows = useCaseKey
			? await base
					.where(eq(SystemPromptsTable.useCaseKey, useCaseKey))
					.orderBy(asc(SystemPromptsTable.useCaseKey), asc(SystemPromptsTable.createdAt))
			: await base.orderBy(asc(SystemPromptsTable.useCaseKey), asc(SystemPromptsTable.createdAt));
		return rows.map((r) => this.toDto(r));
	}

	async findById(id: string): Promise<SystemPromptRow | null> {
		const [row] = await this.db.select().from(SystemPromptsTable).where(eq(SystemPromptsTable.id, id)).limit(1);
		return row ?? null;
	}

	/** Returns the active prompt for the use-case key, or null. promptText = role + guide. */
	async findActiveByUseCaseKey(useCaseKey: string): Promise<{ id: string; promptText: string } | null> {
		const [row] = await this.db
			.select({
				id: SystemPromptsTable.id,
				roleText: SystemPromptsTable.roleText,
				guideText: SystemPromptsTable.guideText,
			})
			.from(SystemPromptsTable)
			.where(and(eq(SystemPromptsTable.useCaseKey, useCaseKey), eq(SystemPromptsTable.isActive, true)))
			.limit(1);
		if (!row) return null;
		return {
			id: row.id,
			promptText: buildPromptText({ roleText: row.roleText, guideText: row.guideText }),
		};
	}

	/** Set this prompt active; deactivate all others with the same useCaseKey. */
	async setActive(id: string): Promise<void> {
		const row = await this.findById(id);
		if (!row) throw new Error("SystemPrompt not found");
		await this.db.transaction(async (tx) => {
			await tx
				.update(SystemPromptsTable)
				.set({ isActive: false, updatedAt: new Date() })
				.where(eq(SystemPromptsTable.useCaseKey, row.useCaseKey));
			await tx
				.update(SystemPromptsTable)
				.set({ isActive: true, updatedAt: new Date() })
				.where(eq(SystemPromptsTable.id, id));
		});
	}

	async update(
		id: string,
		data: { name?: string; promptParts?: { role?: string; guide?: string } },
	): Promise<SystemPromptRow> {
		const updates: { name?: string; roleText?: string; guideText?: string; updatedAt: Date } = {
			updatedAt: new Date(),
		};
		if (data.name !== undefined) updates.name = data.name.trim();
		if (data.promptParts !== undefined) {
			if (data.promptParts.role !== undefined) updates.roleText = data.promptParts.role;
			if (data.promptParts.guide !== undefined) updates.guideText = data.promptParts.guide;
		}
		const [row] = await this.db
			.update(SystemPromptsTable)
			.set(updates)
			.where(eq(SystemPromptsTable.id, id))
			.returning();
		if (!row) throw new Error("SystemPrompt not found");
		return row;
	}

	async delete(id: string): Promise<void> {
		const result = await this.db
			.delete(SystemPromptsTable)
			.where(eq(SystemPromptsTable.id, id))
			.returning({ id: SystemPromptsTable.id });
		if (result.length === 0) throw new Error("SystemPrompt not found");
	}

	private toDto(r: SystemPromptRow): SystemPromptDto {
		const promptText = buildPromptText({ roleText: r.roleText, guideText: r.guideText });
		return {
			id: r.id,
			useCaseKey: r.useCaseKey,
			name: r.name,
			promptText,
			promptParts: { role: r.roleText, guide: r.guideText },
			isActive: r.isActive,
			createdAt: typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString(),
			updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : r.updatedAt.toISOString(),
		};
	}
}
