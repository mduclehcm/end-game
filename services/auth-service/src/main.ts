/** biome-ignore-all lint/suspicious/noExplicitAny: hot reload */

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
	const port = process.env.AUTH_SERVICE_PORT ?? process.env.PORT ?? 3001;
	await app.listen(port);

	if ((module as any).hot) {
		(module as any).hot.accept();
		(module as any).hot.dispose(() => app.close());
	}
}
bootstrap();
