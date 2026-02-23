export enum ErrorSeverity {
	WARNING = "warning",
	ERROR = "error",
	CRITICAL = "critical",
}

export interface EnhancedTemplateError {
	path: string;
	message: string;
	nodeKind?: string;
	severity: ErrorSeverity;
	timestamp?: number;
	context?: Record<string, unknown>;
}

export class ErrorCollector {
	private errors: EnhancedTemplateError[] = [];
	private enableLogging = false;

	constructor(enableLogging = false) {
		this.enableLogging = enableLogging;
	}

	add(
		path: string,
		message: string,
		severity: ErrorSeverity = ErrorSeverity.ERROR,
		nodeKind?: string,
		context?: Record<string, unknown>,
	): void {
		const error: EnhancedTemplateError = {
			path,
			message,
			nodeKind,
			severity,
			timestamp: Date.now(),
			context,
		};

		this.errors.push(error);

		if (this.enableLogging) {
			this.logError(error);
		}
	}

	getAll(): EnhancedTemplateError[] {
		return [...this.errors];
	}

	hasErrors(): boolean {
		return this.errors.length > 0;
	}

	clear(): void {
		this.errors = [];
	}

	count(): number {
		return this.errors.length;
	}

	private logError(error: EnhancedTemplateError): void {
		const prefix = `[${error.severity.toUpperCase()}]`;
		const message = `${prefix} ${error.path}: ${error.message}`;

		switch (error.severity) {
			case ErrorSeverity.WARNING:
				console.warn(message, error.context);
				break;
			case ErrorSeverity.CRITICAL:
				console.error(message, error.context);
				break;
			default:
				console.log(message, error.context);
		}
	}

	format(): string {
		if (this.errors.length === 0) {
			return "No errors";
		}

		return this.errors
			.map((e) => `[${e.severity}] ${e.path}${e.nodeKind ? ` (${e.nodeKind})` : ""}: ${e.message}`)
			.join("\n");
	}
}
