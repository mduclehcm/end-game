/**
 * API versioning strategy.
 * - Current: unversioned paths (/documents, /ai-usage). Proxies may add /api/v1 prefix.
 * - Future: introduce /api/v2 for breaking changes; keep v1 for legacy clients during migration.
 */
export const API_VERSION = "v1";
