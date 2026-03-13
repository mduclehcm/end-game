import { randomBytes } from "node:crypto";

/** Generate a short URL-safe id (10 chars). Used to avoid ESM nanoid in Jest e2e. */
export function shortId(length = 10): string {
	return randomBytes(Math.ceil((length * 3) / 4))
		.toString("base64url")
		.slice(0, length);
}
