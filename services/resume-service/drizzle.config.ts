import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/database/schema",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "postgresql://algo:algo@localhost:5433/algo_resume",
	},
});
