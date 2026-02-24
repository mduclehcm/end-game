/** biome-ignore-all lint/suspicious/noExplicitAny: hot reload */

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { config } from "dotenv";
import { ResumeModule } from "./resume.module";

config(); // load .env before app bootstrap so DATABASE_URL etc. are set

async function bootstrap() {
	const app = await NestFactory.create(ResumeModule);
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
	await app.listen(process.env.PORT ?? 3000);

	if ((module as any).hot) {
		(module as any).hot.accept();
		(module as any).hot.dispose(() => app.close());
	}
}
bootstrap();
