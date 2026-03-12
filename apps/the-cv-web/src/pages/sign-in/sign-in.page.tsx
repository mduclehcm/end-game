import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { PageHeader } from "@/components/header/common.header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth-store";
import { Page } from "../share/page";

const signInSchema = z.object({
	login: z.string().min(1, "Email or username is required"),
	password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
	email: z.string().email("Invalid email"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	username: z.union([z.string().min(2).max(50), z.literal("")]).optional(),
	displayName: z.union([z.string().max(100), z.literal("")]).optional(),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

const SignInPage = Page(function SignInPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirect = searchParams.get("redirect") ?? "/my-resumes";
	const { isAuthenticated, isLoading, login, register } = useAuthStore();
	const [apiError, setApiError] = useState<string | null>(null);

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			navigate(redirect, { replace: true });
		}
	}, [isLoading, isAuthenticated, navigate, redirect]);

	const signInForm = useForm<SignInForm>({
		defaultValues: { login: "", password: "" },
	});

	const signUpForm = useForm<SignUpForm>({
		defaultValues: { email: "", password: "", username: "", displayName: "" },
	});

	const onSignIn = signInForm.handleSubmit(async (data) => {
		const result = signInSchema.safeParse(data);
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0];
				if (path === "login" || path === "password") {
					signInForm.setError(path, { message: issue.message });
				}
			}
			return;
		}
		setApiError(null);
		try {
			await login(result.data.login, result.data.password);
			navigate(redirect, { replace: true });
		} catch (e) {
			setApiError(e instanceof Error ? e.message : "Sign in failed");
		}
	});

	const onSignUp = signUpForm.handleSubmit(async (data) => {
		const result = signUpSchema.safeParse(data);
		if (!result.success) {
			for (const issue of result.error.issues) {
				const path = issue.path[0];
				if (path === "email" || path === "password" || path === "username" || path === "displayName") {
					signUpForm.setError(path, { message: issue.message });
				}
			}
			return;
		}
		setApiError(null);
		try {
			await register({
				email: result.data.email,
				password: result.data.password,
				...(result.data.username ? { username: result.data.username } : undefined),
				...(result.data.displayName ? { displayName: result.data.displayName } : undefined),
			});
			navigate(redirect, { replace: true });
		} catch (e) {
			setApiError(e instanceof Error ? e.message : "Registration failed");
		}
	});

	if (isLoading || isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen flex flex-col bg-linear-to-b from-muted/30 to-background">
			<PageHeader />
			<main className="container mx-auto px-4 py-8 max-w-md flex-1 flex items-center justify-center">
				<Card className="w-full">
					<CardHeader>
						<CardTitle>Sign in</CardTitle>
						<CardDescription>Sign in or create an account to continue.</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="sign-in" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="sign-in">Sign In</TabsTrigger>
								<TabsTrigger value="sign-up">Sign Up</TabsTrigger>
							</TabsList>
							<TabsContent value="sign-in">
								{apiError && (
									<p className="text-destructive text-sm mb-4" role="alert">
										{apiError}
									</p>
								)}
								<form onSubmit={onSignIn} className="space-y-4 pt-4">
									<FieldGroup>
										<Field>
											<FieldLabel>Email or username</FieldLabel>
											<Input type="text" autoComplete="username" {...signInForm.register("login")} />
											<FieldError errors={[signInForm.formState.errors.login]} />
										</Field>
										<Field>
											<FieldLabel>Password</FieldLabel>
											<Input type="password" autoComplete="current-password" {...signInForm.register("password")} />
											<FieldError errors={[signInForm.formState.errors.password]} />
										</Field>
									</FieldGroup>
									<Button type="submit" className="w-full" disabled={signInForm.formState.isSubmitting}>
										{signInForm.formState.isSubmitting ? "Signing in…" : "Sign In"}
									</Button>
								</form>
							</TabsContent>
							<TabsContent value="sign-up">
								{apiError && (
									<p className="text-destructive text-sm mb-4" role="alert">
										{apiError}
									</p>
								)}
								<form onSubmit={onSignUp} className="space-y-4 pt-4">
									<FieldGroup>
										<Field>
											<FieldLabel>Email</FieldLabel>
											<Input type="email" autoComplete="email" {...signUpForm.register("email")} />
											<FieldError errors={[signUpForm.formState.errors.email]} />
										</Field>
										<Field>
											<FieldLabel>Password</FieldLabel>
											<Input type="password" autoComplete="new-password" {...signUpForm.register("password")} />
											<FieldError errors={[signUpForm.formState.errors.password]} />
										</Field>
										<Field>
											<FieldLabel>Username (optional)</FieldLabel>
											<Input type="text" autoComplete="username" {...signUpForm.register("username")} />
											<FieldError errors={[signUpForm.formState.errors.username]} />
										</Field>
										<Field>
											<FieldLabel>Display name (optional)</FieldLabel>
											<Input type="text" autoComplete="name" {...signUpForm.register("displayName")} />
											<FieldError errors={[signUpForm.formState.errors.displayName]} />
										</Field>
									</FieldGroup>
									<Button type="submit" className="w-full" disabled={signUpForm.formState.isSubmitting}>
										{signUpForm.formState.isSubmitting ? "Creating account…" : "Create account"}
									</Button>
								</form>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</main>
		</div>
	);
});

SignInPage.displayName = "SignInPage";

export default SignInPage;
