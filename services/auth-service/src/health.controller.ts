import { Controller, Get } from "@nestjs/common";
// biome-ignore lint/style/useImportType: HealthCheckService must be value import for Nest DI (emitDecoratorMetadata)
import { HealthCheck, type HealthCheckResult, HealthCheckService } from "@nestjs/terminus";

@Controller("health")
export class HealthController {
	constructor(private readonly health: HealthCheckService) {}

	@Get()
	@HealthCheck()
	check(): Promise<HealthCheckResult> {
		return this.health.check([]);
	}
}
