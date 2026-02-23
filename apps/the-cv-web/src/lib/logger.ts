const MODULE_STYLE = "font-weight: bold;";

const LEVEL_STYLES: Record<string, string> = {
	info: "color: cyan",
	warn: "color: orange",
	error: "color: red",
	debug: "color: gray",
	trace: "color: gray",
};

export class Logger {
	private module: string;
	constructor(module: string) {
		this.module = module;
	}

	private formatArgs(level: string, message: string): [string, ...string[]] {
		const levelStyle = LEVEL_STYLES[level] ?? "";
		return [`%c[${this.module}]%c ${level}:%c ${message}`, MODULE_STYLE, levelStyle, ""];
	}

	info(message: string, ...args: unknown[]) {
		console.log(...this.formatArgs("info", message), ...args);
	}

	error(message: string, ...args: unknown[]) {
		console.error(...this.formatArgs("error", message), ...args);
	}

	errorObj(message: string, error: unknown) {
		let innerError = "";
		if (error instanceof Error) {
			innerError = error.message;
		} else if (typeof error === "string") {
			innerError = `${error}`;
		} else {
			innerError = `${JSON.stringify(error)}`;
		}
		console.error(...this.formatArgs("error", `${message}: ${innerError}`));
	}

	warn(message: string) {
		console.warn(...this.formatArgs("warn", message));
	}

	debug(message: string) {
		console.debug(...this.formatArgs("debug", message));
	}

	trace(message: string) {
		console.trace(...this.formatArgs("trace", message));
	}
}
