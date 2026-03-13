import { Controller, Get } from "@nestjs/common";
import { HealthCheck, type HealthCheckResult, HealthCheckService } from "@nestjs/terminus";

@Controller("resume/health")
export class HealthController {
	constructor(private readonly health: HealthCheckService) {}

	@Get()
	@HealthCheck()
	check(): Promise<HealthCheckResult> {
		return this.health.check([]);
	}
}
