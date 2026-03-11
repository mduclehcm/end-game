import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class ZaloAuthGuard extends AuthGuard("zalo") {}
