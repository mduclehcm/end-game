import React, { type PropsWithChildren } from "react";
import { PageHeader } from "@/components/header/common.header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Logger } from "@/lib/logger";

const logger = new Logger("error-page");

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderStackLine(line: string, lineIndex: number): React.ReactNode {
	const parts = line.split(URL_REGEX);
	return parts.map((part, i) => {
		if (i % 2 === 1) {
			return (
				<a
					key={`${lineIndex}-${part.slice(0, 40)}`}
					href={part}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary underline hover:underline break-all"
				>
					{part}
				</a>
			);
		}
		return part;
	});
}

export class GlobalErrorBoundary extends React.Component<PropsWithChildren> {
	state: { hasError: boolean; error: string };
	constructor(props: PropsWithChildren) {
		super(props);
		this.state = { hasError: false, error: "" };
	}

	static getDerivedStateFromError(error: unknown) {
		if (error instanceof Error) {
			return { hasError: true, error: error.message };
		}
		return { hasError: true, error: "Unknown error" };
	}

	render() {
		if (this.state.hasError) {
			return <h1>{this.state.error}</h1>;
		}
		return this.props.children;
	}
}

export class PageErrorBoundary extends React.Component<PropsWithChildren> {
	state: { hasError: boolean; error: unknown | null; detail: string[] | null };
	constructor(props: PropsWithChildren) {
		super(props);
		this.state = { hasError: false, error: null, detail: null };
	}

	static getDerivedStateFromError(error: unknown) {
		logger.error("error", error);
		if (error instanceof Error) {
			return { hasError: true, error, detail: error.stack?.split("\n") ?? null };
		}
		return { hasError: true, error: "Something went wrong", detail: String(error) };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="h-screen w-screen flex flex-col">
					<PageHeader />
					<main className="container mx-auto px-4 py-8">
						<Card className="flex flex-col gap-4 items-center justify-center">
							<CardContent>
								<h2 className="text-xl font-bold text-destructive mb-4">
									{this.state.error instanceof Error
										? this.state.error.message
										: this.state.error != null
											? String(this.state.error)
											: "Something went wrong"}
								</h2>
								<pre className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">
									{(Array.isArray(this.state.detail)
										? this.state.detail
										: this.state.detail
											? [this.state.detail]
											: []
									).map((line, i) => (
										<React.Fragment key={`${i}-${line}`}>
											{renderStackLine(line, i)}
											{"\n"}
										</React.Fragment>
									))}
								</pre>
								<CardFooter className="justify-end">
									<Button onClick={() => window.location.reload()}>Reload</Button>
								</CardFooter>
							</CardContent>
						</Card>
					</main>
				</div>
			);
		}
		return this.props.children;
	}
}
