import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const DRIZZLE = Symbol("DRIZZLE");

export const drizzleProvider = {
	provide: DRIZZLE,
	useFactory: () => {
		const connectionString = process.env.DATABASE_URL;
		if (!connectionString) {
			throw new Error("DATABASE_URL environment variable is not set");
		}
		const pool = new Pool({ connectionString });
		return drizzle(pool, { schema });
	},
};
