import type { DocumentData } from "@algo/cv-core";
import { FileText, FileUp, Sparkles } from "lucide-react";
import { type PropsWithChildren, type SyntheticEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	buildDocumentDataFromFieldValues,
	getBlankDocumentData,
	getDefaultDocumentData,
} from "@/data/default-document-data";
import { useCreateDocument } from "@/hooks/use-document-actions";
import { parsePdfResume } from "@/lib/api";

type CreateResumeDialogProps = PropsWithChildren;

type Step = "choice" | "form" | "import-file";
type CreateMode = "blank" | "example" | "pdf";

export function CreateResumeDialog({ children }: CreateResumeDialogProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<Step>("choice");
	const [mode, setMode] = useState<CreateMode>("blank");
	const [title, setTitle] = useState("");
	const [initialData, setInitialData] = useState<DocumentData | undefined>(undefined);
	const [parsing, setParsing] = useState(false);
	const [parseError, setParseError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const { createDocument, loading } = useCreateDocument();

	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setStep("choice");
			setMode("blank");
			setTitle("");
			setParseError(null);
			setInitialData(undefined);
		}
		setOpen(next);
	};

	const handleChoiceBlank = () => {
		setMode("blank");
		setTitle("");
		setInitialData(getBlankDocumentData());
		setStep("form");
	};

	const handleChoiceExample = () => {
		setMode("example");
		setTitle("Example resume");
		setInitialData(getDefaultDocumentData());
		setStep("form");
	};

	const handleChoiceImportPdf = () => {
		setMode("pdf");
		setParseError(null);
		setInitialData(undefined);
		setStep("import-file");
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setParseError(null);
		setParsing(true);
		try {
			const parsed = await parsePdfResume(file);
			const data = buildDocumentDataFromFieldValues(parsed.fieldValues);
			setInitialData(data);
			setTitle(parsed.title?.trim() || "Imported Resume");
			setStep("form");
		} catch (err) {
			setParseError(err instanceof Error ? err.message : "Failed to parse PDF");
		} finally {
			setParsing(false);
			e.target.value = "";
		}
	};

	const handleBackFromForm = () => {
		setStep("choice");
		setTitle("");
		setInitialData(undefined);
	};

	const handleSubmit = (e: SyntheticEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		createDocument({
			title: trimmed,
			initialData,
		});
		setOpen(false);
	};

	const showBackFromForm = step === "form" && (mode === "blank" || mode === "example" || mode === "pdf");

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				{step === "choice" && (
					<>
						<DialogHeader>
							<DialogTitle>Create new resume</DialogTitle>
							<DialogDescription>Choose how you want to get started.</DialogDescription>
						</DialogHeader>
						<div className="grid gap-2">
							<Button
								type="button"
								variant="outline"
								className="h-auto flex flex-col items-start gap-1 py-3 text-left"
								onClick={handleChoiceBlank}
							>
								<span className="flex items-center gap-2 font-medium">
									<FileText className="size-4" />
									Create blank CV
								</span>
								<span className="text-muted-foreground text-xs font-normal">
									Start from scratch with an empty resume.
								</span>
							</Button>
							<Button
								type="button"
								variant="outline"
								className="h-auto flex flex-col items-start gap-1 py-3 text-left"
								onClick={handleChoiceExample}
							>
								<span className="flex items-center gap-2 font-medium">
									<Sparkles className="size-4" />
									Use example CV
								</span>
								<span className="text-muted-foreground text-xs font-normal">Pre-filled sample you can edit.</span>
							</Button>
							<Button
								type="button"
								variant="outline"
								className="h-auto flex flex-col items-start gap-1 py-3 text-left"
								onClick={handleChoiceImportPdf}
							>
								<span className="flex items-center gap-2 font-medium">
									<FileUp className="size-4" />
									Import from PDF
								</span>
								<span className="text-muted-foreground text-xs font-normal">
									Upload a resume and we’ll parse it with AI.
								</span>
							</Button>
						</div>
					</>
				)}

				{step === "import-file" && (
					<>
						<DialogHeader>
							<DialogTitle>Import from PDF</DialogTitle>
							<DialogDescription>
								Select a resume PDF. We’ll extract the content and structure it for editing.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4">
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf,application/pdf"
								className="hidden"
								onChange={handleFileChange}
							/>
							<Button type="button" variant="outline" disabled={parsing} onClick={() => fileInputRef.current?.click()}>
								{parsing ? "Parsing…" : "Select PDF file"}
							</Button>
							{parseError && <p className="text-destructive text-sm">{parseError}</p>}
						</div>
						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setStep("choice")}>
								Back
							</Button>
						</DialogFooter>
					</>
				)}

				{step === "form" && (
					<>
						<DialogHeader>
							<DialogTitle>
								{mode === "blank"
									? "Create blank resume"
									: mode === "example"
										? "Use example resume"
										: "Import from PDF"}
							</DialogTitle>
							<DialogDescription>Give your resume a title to get started.</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleSubmit} className="grid gap-4">
							<div className="grid gap-2">
								<Label htmlFor="resume-title">Title</Label>
								<Input
									id="resume-title"
									placeholder="My Resume"
									maxLength={50}
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									autoFocus
								/>
							</div>
							<DialogFooter>
								{showBackFromForm && (
									<Button type="button" variant="ghost" onClick={handleBackFromForm}>
										Back
									</Button>
								)}
								<Button type="submit" disabled={!title.trim() || loading}>
									{loading ? "Creating..." : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
