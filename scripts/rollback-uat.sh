#!/usr/bin/env bash
# Manually roll UAT back to a specific known-good commit.
# Usage: ./scripts/rollback-uat.sh <commit-sha>
set -euo pipefail

APP_DIR="/home/asiriservice/medisquare"
APP_NAME="medisquare"
HEALTH_URL="http://localhost:4444/"

COMMIT="${1:?Usage: rollback-uat.sh <commit-sha>}"

cd "$APP_DIR"
echo "Rolling back to $COMMIT (currently at $(git rev-parse HEAD))"

git reset --hard "$COMMIT"
corepack pnpm install --frozen-lockfile
corepack pnpm build

pm2 restart "$APP_NAME" --update-env
pm2 save

sleep 2
if curl -sf -o /dev/null "$HEALTH_URL"; then
  echo "Rollback to $COMMIT OK - $HEALTH_URL is responding."
else
  echo "WARNING: health check failed after rollback to $COMMIT. Check: pm2 logs $APP_NAME"
  exit 1
fi
