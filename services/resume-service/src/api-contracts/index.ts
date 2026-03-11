/**
 * API contracts for resume-service.
 * Current: unversioned paths (/documents, /ai-usage).
 * Target v2: use /api/v2 prefix or Accept-Version header when introducing breaking changes.
 */

export * from "./ai-usage-api.contract";
export * from "./document-api.contract";
export { API_VERSION } from "./version";
