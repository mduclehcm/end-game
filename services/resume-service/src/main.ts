/** biome-ignore-all lint/suspicious/noExplicitAny: hot reload */

import path from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { config } from "dotenv";
import { ResumeModule } from "./resume.module";

// Load .env: first from cwd, then from monorepo root (when running from services/resume-service)
config();
if (!process.env.OPENAI_API_KEY) {
	config({ path: path.resolve(process.cwd(), "../../.env") });
}

async function bootstrap() {
	const app = await NestFactory.create(ResumeModule);
	app.setGlobalPrefix("api");
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
	await app.listen(process.env.PORT ?? 3000);

	if ((module as any).hot) {
		(module as any).hot.accept();
		(module as any).hot.dispose(() => app.close());
	}
}
bootstrap();
