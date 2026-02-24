import {
	CreateDocumentResponse,
	DeleteDocumentResponse,
	GetDocumentListResponse,
	GetDocumentResponse,
	UpdateDocumentResponse,
} from "@algo/cv-core";
import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post } from "@nestjs/common";
import { DocumentService } from "./document.service";
import { CreateDocumentPayloadDto } from "./dto/create-document.dto";
import { UpdateDocumentPayloadDto } from "./dto/update-document.dto";

@Controller("documents")
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Get()
	async findAll(): Promise<GetDocumentListResponse> {
		const documents = await this.documentService.findAll();
		return {
			data: documents,
		};
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
