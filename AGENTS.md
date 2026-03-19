# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Algo is a monorepo CV/resume builder platform. See `package.json` scripts and workspace structure in `pnpm-workspace.yaml`. Linting uses Biome (`pnpm lint`). Backend services use NestJS + Drizzle ORM; frontends use React + Vite.

### Node version

The project requires Node.js 24+ (`"engines": { "node": "^24.12" }`). Use `nvm use 24` if not already active.

### Package manager

pnpm 10.27.0 via corepack. Run `corepack enable && corepack prepare pnpm@10.27.0 --activate` if needed.

### Infrastructure

All infrastructure runs via Docker Compose (`docker compose up -d`): two PostgreSQL 18 instances (auth + resume), Kong API Gateway (db-less), MinIO (S3-compatible storage), plus the `auth-service` and `resume-service` NestJS backends.

Start Docker daemon first: `sudo dockerd &>/tmp/dockerd.log &` then `sudo docker compose up -d`.

### Databases (two separate DBs)

- **Auth DB** (`postgres` service, port 5432, database `algo_auth`): used by `auth-service` — tables `users`, `oauth_accounts`, `refresh_tokens`.
- **Resume DB** (`postgres-resume` service, port 5433, database `algo_resume`): used by `resume-service` — tables `llm_usage_logs`, `resume_documents`, `resume_exports`, `resume_export_download_tokens`, `resume_field_values`, `system_prompts`.

Each service has its own Drizzle schema and migrations; run `drizzle-kit push` or `drizzle-kit migrate` per service (from that service’s directory or via its package scripts). No cross-service table conflicts.

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
| PostgreSQL (auth) | via Docker Compose | 5432 |
| PostgreSQL (resume) | via Docker Compose | 5433 |

The frontend proxies `/api` requests to Kong on port 8000.

### Testing

- **Lint:** `pnpm lint` (runs Biome; pre-existing errors may exist in the codebase)
- **Frontend tests:** `pnpm --filter @algo/the-cv test` (Vitest)
- **Backend tests:** `pnpm --filter @algo/resume-service test` (Jest)
