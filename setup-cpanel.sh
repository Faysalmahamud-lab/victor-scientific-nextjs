#!/usr/bin/env bash
set -Eeuo pipefail

fail() { echo; echo "ERROR: $*" >&2; exit 1; }
step() {
  echo
  echo "============================================================"
  echo "$*"
  echo "============================================================"
}

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

step "Victor Scientific - cPanel staging setup"

[[ -f package.json ]] || fail "package.json not found. Extract the ZIP into the configured Application Root."
[[ -f app.js ]] || fail "app.js is missing."
[[ -f prisma/schema.prisma ]] || fail "Prisma schema is missing."
[[ -f .env ]] || fail ".env is missing. Create it from .env.example outside public_html."

set -a
# shellcheck disable=SC1091
source ./.env
set +a

command -v node >/dev/null 2>&1 || fail "Node.js is unavailable. Activate the cPanel Node.js virtual environment first."
command -v npm >/dev/null 2>&1 || fail "npm is unavailable. Activate the cPanel Node.js virtual environment first."

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
[[ "$NODE_MAJOR" -ge 22 ]] || fail "Node.js 22 or newer is required. Current version: $(node -v)"

[[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL is missing."
[[ -n "${AUTH_SECRET:-}" && ${#AUTH_SECRET} -ge 32 ]] || fail "AUTH_SECRET must contain at least 32 characters."
[[ -n "${NEXT_PUBLIC_SITE_URL:-}" ]] || fail "NEXT_PUBLIC_SITE_URL is missing."

# Keep optional native/Rust worker pools conservative on shared hosting.
export UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-1}"
export RAYON_NUM_THREADS="${RAYON_NUM_THREADS:-1}"
export TOKIO_WORKER_THREADS="${TOKIO_WORKER_THREADS:-1}"
export NEXT_TELEMETRY_DISABLED=1
export npm_config_audit=false
export npm_config_fund=false
export npm_config_maxsockets=1

step "Installing dependencies with conservative network concurrency"
npm install --no-audit --no-fund --prefer-offline

step "Validating the checked-in Prisma schema"
# Do not run `prisma db pull` automatically here. On this shared host the
# schema-engine process has previously failed with EAGAIN at the account's
# fixed NPROC limit. Introspection is a separate, explicitly controlled task.
npx prisma validate

step "Generating Prisma Client"
npx prisma generate

step "Running TypeScript checks"
npm run typecheck

step "Running ESLint"
npm run lint

step "Running unit tests"
npm test

step "Creating production build"
npm run build

step "Setup completed"
cat <<'EOF'
Dependency, schema, type, lint, unit-test and production-build checks completed.

Next:
  1. Open cPanel > Setup Node.js App.
  2. Restart the STAGING application only.
  3. Check /api/health and complete the staging acceptance tests.

Do not switch the production domain until checkout, customer accounts,
admin CRUD, order processing, payment/courier flows, SEO parity and rollback
have been verified. Keep the Laravel site and production database intact.
EOF
