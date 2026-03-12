/**
 * Resume API contracts (schemas and types for /documents, /ai-usage).
 * Shared between backend (resume-service) and frontend (the-cv-web).
 * Use for validation and e2e contract baselines.
 */

export * from "./ai-usage-api.contract";
export * from "./document-api.contract";
export { API_VERSION } from "./version";
