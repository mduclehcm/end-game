import { Module } from "@nestjs/common";
import { AiRewriteService } from "./ai-rewrite.service";
import { DocumentController } from "./document.controller";
import { DocumentRepository } from "./document.repository";
import { DocumentService } from "./document.service";
import { ParsePdfService } from "./parse-pdf.service";

@Module({
	controllers: [DocumentController],
	providers: [DocumentService, DocumentRepository, ParsePdfService, AiRewriteService],
	exports: [DocumentService],
})
export class DocumentModule {}
