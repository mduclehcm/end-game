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
	Req,
	UnauthorizedException,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import multer from "multer";
import { type RequestUser, RequireUserGuard } from "../../guards/require-user.guard";
import { DocumentService } from "./document.service";
import { CreateDocumentPayloadDto, type ParsedResumeDto, RewriteFieldDto, UpdateDocumentPayloadDto } from "./dto";
import { ParsePdfUseCase } from "./use-cases";

function getUserId(req: Request): string {
	const user = (req as Request & { user?: RequestUser }).user;
	if (!user?.sub) throw new UnauthorizedException();
	return user.sub;
}

@Controller("documents")
export class DocumentController {
	constructor(
		private readonly documentService: DocumentService,
		private readonly parsePdfUseCase: ParsePdfUseCase,
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
		const data = await this.parsePdfUseCase.execute(file.buffer);
		return { data };
	}

	@Get()
	@UseGuards(RequireUserGuard)
	async findAll(@Req() req: Request): Promise<GetDocumentListResponse> {
		const documents = await this.documentService.findAll(getUserId(req));
		return {
			data: documents,
		};
	}

	@Post(":id/rewrite-field")
	@UseGuards(RequireUserGuard)
	async rewriteField(
		@Param("id") id: string,
		@Req() req: Request,
		@Body() dto: RewriteFieldDto,
	): Promise<{ data: { value: string } | DocumentDetail }> {
		const result = await this.documentService.rewriteField(id, getUserId(req), dto);
		return { data: result };
	}

	@Get(":id")
	@UseGuards(RequireUserGuard)
	async findById(@Param("id") id: string, @Req() req: Request): Promise<GetDocumentResponse> {
		const document = await this.documentService.findById(id, getUserId(req));
		return {
			data: document,
		};
	}

	@Post()
	@UseGuards(RequireUserGuard)
	async create(@Body() dto: CreateDocumentPayloadDto, @Req() req: Request): Promise<CreateDocumentResponse> {
		const document = await this.documentService.create(dto, getUserId(req));
		if (!document) {
			throw new InternalServerErrorException();
		}
		return {
			data: document,
		};
	}

	@Patch(":id")
	@UseGuards(RequireUserGuard)
	async update(
		@Param("id") id: string,
		@Req() req: Request,
		@Body() dto: UpdateDocumentPayloadDto,
	): Promise<UpdateDocumentResponse> {
		const document = await this.documentService.update(id, getUserId(req), dto);
		return {
			data: document,
		};
	}

	@Delete(":id")
	@UseGuards(RequireUserGuard)
	async remove(@Param("id") id: string, @Req() req: Request): Promise<DeleteDocumentResponse> {
		const result = await this.documentService.remove(id, getUserId(req));
		if (!result) {
			throw new InternalServerErrorException();
		}
		return {
			success: result,
		};
	}
}
