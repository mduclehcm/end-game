import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { ChatController } from "./chat.controller";
import { HealthController } from "./health.controller";

@Module({
	imports: [TerminusModule],
	controllers: [ChatController, HealthController],
	providers: [],
})
export class ChatModule {}
