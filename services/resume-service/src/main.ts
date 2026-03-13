/** biome-ignore-all lint/suspicious/noExplicitAny: hot reload */

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ResumeModule } from "./resume.module";

async function bootstrap() {
	const app = await NestFactory.create(ResumeModule);
	const configService = app.get(ConfigService);
	app.setGlobalPrefix("api");
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
	const port = Number(configService.get<string>("PORT") ?? 3000);
	await app.listen(Number.isFinite(port) ? port : 3000);

	if ((module as any).hot) {
		(module as any).hot.accept();
		(module as any).hot.dispose(() => app.close());
	}
}
bootstrap();
