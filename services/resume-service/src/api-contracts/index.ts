/**
 * API contracts for resume-service.
 * Current: unversioned paths (/documents, /ai-usage).
 * Target v2: use /api/v2 prefix or Accept-Version header when introducing breaking changes.
 */

export { API_VERSION } from "./version";
export * from "./document-api.contract";
export * from "./ai-usage-api.contract";
