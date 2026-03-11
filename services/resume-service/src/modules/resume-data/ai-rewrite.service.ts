import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { LlmClient } from "@ports";
import { LLM_CLIENT } from "@ports";

@Injectable()
export class AiRewriteService {
	constructor(@Inject(LLM_CLIENT) private readonly llmClient: LlmClient) {}

	async rewrite(currentValue: string, sectionKind: string, fieldKey: string): Promise<string> {
		const kind = sectionKind.trim().toLowerCase();
		const key = fieldKey.trim();
		if (!kind || !key) {
			throw new BadRequestException("sectionKind and fieldKey are required");
		}

		try {
			return await this.llmClient.rewrite(currentValue, kind, key);
		} catch (err) {
			if (err instanceof BadRequestException) throw err;
			if (err instanceof Error && err.message === "AI rewrite not configured") {
				throw new ServiceUnavailableException("AI rewrite not configured");
			}
			if (err instanceof Error && err.message === "Rewrite not supported for this field") {
				throw new BadRequestException("Rewrite not supported for this field");
			}
			throw err;
		}
	}
}
