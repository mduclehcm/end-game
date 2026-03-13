# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Algo is a monorepo CV/resume builder platform. See `package.json` scripts and workspace structure in `pnpm-workspace.yaml`. Linting uses Biome (`pnpm lint`). Backend services use NestJS + Drizzle ORM; frontends use React + Vite.

### Node version

The project requires Node.js 24+ (`"engines": { "node": "^24.12" }`). Use `nvm use 24` if not already active.

### Package manager

pnpm 10.27.0 via corepack. Run `corepack enable && corepack prepare pnpm@10.27.0 --activate` if needed.

### Infrastructure

All infrastructure runs via Docker Compose (`docker compose up -d`): PostgreSQL 18, Kong API Gateway (db-less), MinIO (S3-compatible storage), plus the `auth-service` and `resume-service` NestJS backends.

Start Docker daemon first: `sudo dockerd &>/tmp/dockerd.log &` then `sudo docker compose up -d`.

### Database migrations (shared DB gotcha)

Both `auth-service` and `resume-service` share a single PostgreSQL database (`algo_dev`). **Do NOT use `drizzle-kit push --force`** — it drops tables belonging to the other service. Without `--force`, drizzle push also drops unknown tables silently.

**Safe approach:** Create tables via SQL directly or run `drizzle-kit push` (without `--force`) for each service in sequence, using `expect` to auto-select "create table" for each prompt. Run auth-service push first (tables: `users`, `oauth_accounts`, `refresh_tokens`), then resume-service (tables: `llm_usage_logs`, `resume_documents`, `resume_exports`, `resume_export_download_tokens`, `resume_field_values`, `system_prompts`). See the `expect` pattern used during initial setup for reference.

### Environment variables

Copy `.env.example` to `.env` and fill in at minimum `JWT_SECRET` and `JWT_REFRESH_SECRET`. OpenAI, Google OAuth, and Zalo OAuth keys are optional (core CRUD works without them).

### Running services

| Service | How to start | Port |
|---|---|---|
| Frontend (the-cv-web) | `pnpm dev:the-cv` | 5173 |
| Admin portal | `pnpm dev:the-cv-admin` | 5174 |
| Auth service | via Docker Compose | 3001 |
| Resume service | via Docker Compose | 3000 |
| Kong API Gateway | via Docker Compose | 8000 |
| PostgreSQL | via Docker Compose | 5432 |

The frontend proxies `/api` requests to Kong on port 8000.

### Testing

- **Lint:** `pnpm lint` (runs Biome; pre-existing errors may exist in the codebase)
- **Frontend tests:** `pnpm --filter @algo/the-cv test` (Vitest)
- **Backend tests:** `pnpm --filter @algo/resume-service test` (Jest)
