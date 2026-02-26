#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_FILE="$ROOT_DIR/prisma/dev.db"
MIGRATION_FILE="$ROOT_DIR/prisma/migrations/0001_init/migration.sql"

if [ ! -f "$DB_FILE" ]; then
  mkdir -p "$(dirname "$DB_FILE")"
  touch "$DB_FILE"
fi

sqlite3 "$DB_FILE" < "$MIGRATION_FILE"
"$ROOT_DIR/node_modules/.bin/prisma" generate --schema "$ROOT_DIR/prisma/schema.prisma"

echo "Local SQLite schema ensured at $DB_FILE"
