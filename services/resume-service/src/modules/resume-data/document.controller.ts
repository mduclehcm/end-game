import type { DocumentDetail } from "@algo/cv-core";
import {
	CreateDocumentResponse,
	DeleteDocumentResponse,
	GetDocumentListResponse,
	GetDocumentResponse,
	UpdateDocumentResponse,
} from "@algo/cv-core";
import {
	Body,
	Controller,
	Delete,
	Get,
	InternalServerErrorException,
	Param,
	Patch,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import multer from "multer";
import { DocumentService } from "./document.service";
import { CreateDocumentPayloadDto } from "./dto/create-document.dto";
import type { ParsedResumeDto } from "./dto/parsed-resume.dto";
import { RewriteFieldDto } from "./dto/rewrite-field.dto";
import { UpdateDocumentPayloadDto } from "./dto/update-document.dto";
import { ParsePdfService } from "./parse-pdf.service";

@Controller("documents")
export class DocumentController {
	constructor(
		private readonly documentService: DocumentService,
		private readonly parsePdfService: ParsePdfService,
	) {}

	@Post("parse-pdf")
	@UseInterceptors(
		FileInterceptor("file", {
			storage: multer.memoryStorage(),
			limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
		}),
	)
	async parsePdf(@UploadedFile() file: Express.Multer.File): Promise<{ data: ParsedResumeDto }> {
		if (!file?.buffer) {
			throw new InternalServerErrorException("No file uploaded");
		}
		const data = await this.parsePdfService.parsePdf(file.buffer);
		return { data };
	}

	@Get()
	async findAll(): Promise<GetDocumentListResponse> {
		const documents = await this.documentService.findAll();
		return {
			data: documents,
		};
	}

	@Post(":id/rewrite-field")
	async rewriteField(
		@Param("id") id: string,
		@Body() dto: RewriteFieldDto,
	): Promise<{ data: { value: string } | DocumentDetail }> {
		const result = await this.documentService.rewriteField(id, dto);
		return { data: result };
	}

	@Get(":id")
	async findById(@Param("id") id: string): Promise<GetDocumentResponse> {
		const document = await this.documentService.findById(id);
		return {
			data: document,
		};
	}

	@Post()
	async create(@Body() dto: CreateDocumentPayloadDto): Promise<CreateDocumentResponse> {
		const document = await this.documentService.create(dto);
		if (!document) {
			throw new InternalServerErrorException();
		}
		return {
			data: document,
		};
	}

	@Patch(":id")
	async update(@Param("id") id: string, @Body() dto: UpdateDocumentPayloadDto): Promise<UpdateDocumentResponse> {
		const document = await this.documentService.update(id, dto);
		return {
			data: document,
		};
	}

	@Delete(":id")
	async remove(@Param("id") id: string): Promise<DeleteDocumentResponse> {
		const result = await this.documentService.remove(id);
		if (!result) {
			throw new InternalServerErrorException();
		}
		return {
			success: result,
		};
	}
}
