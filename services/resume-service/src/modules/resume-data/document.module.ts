import { Module } from "@nestjs/common";
import { LLM_CLIENT } from "@ports";
import { RequireUserGuard } from "../../guards/require-user.guard";
import { AiUsageModule } from "../ai-usage/ai-usage.module";
import { SystemPromptModule } from "../system-prompt/system-prompt.module";
import { AiRewriteService } from "./ai-rewrite.service";
import { DocumentController } from "./document.controller";
import { DocumentRepository } from "./document.repository";
import { DocumentService } from "./document.service";
import { OpenAILlmAdapter } from "./infrastructure/openai-llm.adapter";
import { ParsePdfService } from "./parse-pdf.service";
import { CreateDocumentUseCase, ParsePdfUseCase, RewriteFieldUseCase, UpdateDocumentUseCase } from "./use-cases";

@Module({
	imports: [AiUsageModule, SystemPromptModule],
	controllers: [DocumentController],
	providers: [
		DocumentService,
		DocumentRepository,
		RequireUserGuard,
		{ provide: LLM_CLIENT, useClass: OpenAILlmAdapter },
		ParsePdfService,
		AiRewriteService,
		CreateDocumentUseCase,
		UpdateDocumentUseCase,
		RewriteFieldUseCase,
		ParsePdfUseCase,
	],
	exports: [DocumentService],
})
export class DocumentModule {}
