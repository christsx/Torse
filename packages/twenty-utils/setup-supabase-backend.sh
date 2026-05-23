#!/bin/bash
# =============================================================================
# Twenty CRM — Supabase Backend Setup (clean, no demo seed data)
# =============================================================================
# Points the backend at your Supabase Postgres project and initializes a fresh
# Twenty schema without Apple/YCombinator demo workspaces.
#
# Prerequisites:
#   1. Set SUPABASE_DB_PASSWORD in packages/twenty-server/.env
#      (Supabase Dashboard → Project Settings → Database → Database password)
#   2. Redis still required locally or via REDIS_URL in .env
#
# Usage (from repo root):
#   bash packages/twenty-utils/setup-supabase-backend.sh
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/packages/twenty-server/.env"

info() { echo "=> $*"; }
ok() { echo "   done: $*"; }
fail() { echo "   FAIL: $*" >&2; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  fail "Missing $ENV_FILE — copy from .env.example first"
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  fail "SUPABASE_PROJECT_REF is not set in $ENV_FILE"
fi

if [ -z "${SUPABASE_DB_PASSWORD:-}" ] || [ "$SUPABASE_DB_PASSWORD" = "REPLACE_WITH_YOUR_SUPABASE_DB_PASSWORD" ]; then
  fail "Set SUPABASE_DB_PASSWORD in $ENV_FILE (Supabase Dashboard → Database → password)"
fi

# Build connection URL for Supabase direct connection (required for migrations/DDL)
export PG_DATABASE_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
export PG_SSL_ALLOW_SELF_SIGNED=true

info "Using Supabase project: ${SUPABASE_PROJECT_REF}"
info "Building twenty-server..."
cd "$REPO_ROOT"
npx nx build twenty-server

info "Resetting database (no demo seed)..."
cd "$REPO_ROOT/packages/twenty-server"
PG_DATABASE_URL="$PG_DATABASE_URL" npx nx database:reset twenty-server --configuration=no-seed

ok "Supabase backend ready — no demo data"
echo ""
echo "  Sign up at http://localhost:3001 to create your workspace"
echo "  Backend API: http://localhost:3000"
echo ""
