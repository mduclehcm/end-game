import type { CreateExportResponse, GetExportListResponse } from "@algo/cv-core";
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
	Req,
	Res,
	StreamableFile,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { RequestUser } from "../../guards/require-user.guard";
import { RequireUserGuard } from "../../guards/require-user.guard";
import { CreateExportDto } from "./dto/create-export.dto";
import { ExportService } from "./export.service";

function getUserId(req: Request): string {
	const user = (req as Request & { user?: RequestUser }).user;
	if (!user?.sub) throw new UnauthorizedException();
	return user.sub;
}

@Controller("resume/exports")
export class ExportController {
	constructor(private readonly exportService: ExportService) {}

	@Post()
	@HttpCode(HttpStatus.ACCEPTED)
	@UseGuards(RequireUserGuard)
	async create(@Body() dto: CreateExportDto, @Req() req: Request): Promise<CreateExportResponse> {
		const data = await this.exportService.createExport(getUserId(req), dto.documentId);
		return { data };
	}

	@Get()
	@UseGuards(RequireUserGuard)
	async list(@Req() req: Request): Promise<GetExportListResponse> {
		const data = await this.exportService.listExports(getUserId(req));
		return { data };
	}

	@Post(":id/download-link")
	@UseGuards(RequireUserGuard)
	async createDownloadLink(
		@Param("id") id: string,
		@Req() req: Request,
	): Promise<{ data: { downloadUrl: string; expiresInSeconds: number } }> {
		const result = await this.exportService.createDownloadLink(id, getUserId(req));
		return { data: result };
	}

	@Get(":id/download")
	async download(
		@Param("id") id: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		const token = typeof req.query.token === "string" ? req.query.token : "";
		if (!token) {
			throw new UnauthorizedException("Missing token");
		}
		const file = await this.exportService.consumeTokenAndGetFile(id, token);
		setDownloadHeaders(res, file.fileName, file.contentType);
		return new StreamableFile(file.body);
	}
}

/** Public one-time download (no JWT), streamed from service to avoid exposing MinIO URL. */
@Controller("resume/export-download")
export class ExportDownloadPublicController {
	constructor(private readonly exportService: ExportService) {}

	@Get()
	async download(
		@Query("exportId") exportId: string,
		@Query("token") token: string,
		@Res({ passthrough: true }) res: Response,
	): Promise<StreamableFile> {
		if (!exportId || !token) {
			throw new UnauthorizedException("Missing exportId or token");
		}
		const file = await this.exportService.consumeTokenAndGetFile(exportId, token);
		setDownloadHeaders(res, file.fileName, file.contentType);
		return new StreamableFile(file.body);
	}
}

function setDownloadHeaders(res: Response, fileName: string, contentType: string): void {
	const safeFileName = fileName.replace(/"/g, "");
	res.setHeader("Content-Type", contentType);
	res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
}
