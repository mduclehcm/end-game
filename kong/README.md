# Kong Gateway (declarative config)

Kong runs in **db-less** mode with a single declarative YAML. It provides:

- **JWT**: Decode and validate Bearer tokens on protected routes (`/api/auth/me`, `/api/resume/documents`, `/api/admin/ai-usage`, `/api/admin/system-prompts`). The auth-service issues tokens with `iss: "algovn"`; Kong validates using the same `JWT_SECRET` from `.env`.
- **User ID header**: A post-function runs after the JWT plugin (lower priority). When JWT validates successfully it sets `kong.ctx.shared.authenticated_jwt_token`. The post-function decodes the payload and sets `X-User-Id` (and optionally `X-Jwt-Claim-Email`) so upstream services receive a trusted user id without parsing JWTs.
- **Rate limiting**: Per-service limits (auth: 100/min, 5000/hour; resume: 60/min, 2000/hour). Uses `local` policy (in-memory, per node).

## Usage

1. Ensure `JWT_SECRET` is set in `.env` (same value as auth-service) so Kong can validate tokens. If unset, Kong uses a default so it can start, but token validation will fail unless auth-service uses the same default.
2. Start stack: `docker compose up -d`. Kong proxy is on **port 8000**.
3. Call APIs via Kong:
   - Public (no JWT): `POST http://localhost:8000/api/auth/login`, `POST http://localhost:8000/api/auth/refresh`, etc.
   - Protected: `Authorization: Bearer <access_token>` for `GET http://localhost:8000/api/auth/me`, `http://localhost:8000/api/resume/documents`, `http://localhost:8000/api/admin/ai-usage`, `http://localhost:8000/api/admin/system-prompts`, etc.

Direct access to auth (3001) and resume (3000) still works for development.

## Config

- `kong.yml.template` – declarative config; `${JWT_SECRET}` is replaced at container start from `.env`.
- `KONG_ROUTER_FLAVOR=traditional_compat` (in docker-compose) – ensures path prefix matching so `/api/resume`, `/api/admin`, etc. match correctly.
- Edit the template and rebuild/restart Kong to change routes, limits, or JWT consumer.
