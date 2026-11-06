#!/usr/bin/env bash
set -Eeuo pipefail

fail() { echo "ERROR: $*" >&2; exit 1; }

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_ROOT"

[[ "${ALLOW_STAGING_INTROSPECTION:-}" == "yes" ]] || \
  fail "Set ALLOW_STAGING_INTROSPECTION=yes only after confirming DATABASE_URL points to the staging database and the database user is read-only."

[[ -f .env ]] || fail ".env is missing."
[[ -f prisma/schema.prisma ]] || fail "Prisma schema is missing."
command -v npx >/dev/null 2>&1 || fail "Activate the cPanel Node.js virtual environment first."

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
cp prisma/schema.prisma "backups/schema-before-introspection-${STAMP}.prisma"

export CHECKPOINT_DISABLE=1
export PRISMA_HIDE_UPDATE_MESSAGE=1
export UV_THREADPOOL_SIZE=1
export RAYON_NUM_THREADS=1
export TOKIO_WORKER_THREADS=1

echo "Running Prisma introspection against the configured staging database..."
echo "This reads schema metadata and updates only prisma/schema.prisma."
echo "If the host returns EAGAIN, stop and do not retry repeatedly."

npx prisma db pull
npx prisma validate
npx prisma generate

echo "Staging introspection completed. Review the schema diff before deployment."
