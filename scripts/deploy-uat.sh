#!/usr/bin/env bash
# Deploys the currently checked-out commit of uat_staging: installs deps,
# builds, restarts the medisquare PM2 process, health-checks it, and
# automatically rolls back to the previous commit if the health check fails.
#
# Expected to run from /home/asiriservice/medisquare with the working tree
# already reset to the commit you want deployed (the CI workflow does the
# git fetch/checkout/reset before invoking this script).
set -euo pipefail

APP_DIR="/home/asiriservice/medisquare"
APP_NAME="medisquare"
HEALTH_URL="http://localhost:4444/"
LOG_FILE="$APP_DIR/deploy.log"
HEALTH_ATTEMPTS=10
HEALTH_INTERVAL=3

cd "$APP_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_FILE"
}

health_check() {
  local i=0
  while [ "$i" -lt "$HEALTH_ATTEMPTS" ]; do
    if curl -sf -o /dev/null "$HEALTH_URL"; then
      return 0
    fi
    i=$((i + 1))
    sleep "$HEALTH_INTERVAL"
  done
  return 1
}

PREVIOUS_COMMIT="${DEPLOY_PREVIOUS_COMMIT:-$(git rev-parse HEAD)}"
NEW_COMMIT="$(git rev-parse HEAD)"
log "Starting deploy of $NEW_COMMIT (previous: $PREVIOUS_COMMIT)"

corepack pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"
corepack pnpm build 2>&1 | tee -a "$LOG_FILE"

log "Restarting PM2 process '$APP_NAME'"
pm2 restart "$APP_NAME" --update-env
pm2 save

log "Waiting for health check at $HEALTH_URL"
if health_check; then
  log "Health check passed. Deploy of $NEW_COMMIT successful."
  exit 0
fi

log "Health check FAILED after deploying $NEW_COMMIT. Rolling back to $PREVIOUS_COMMIT."
git reset --hard "$PREVIOUS_COMMIT"
corepack pnpm install --frozen-lockfile 2>&1 | tee -a "$LOG_FILE"
corepack pnpm build 2>&1 | tee -a "$LOG_FILE"
pm2 restart "$APP_NAME" --update-env
pm2 save

if health_check; then
  log "Rollback to $PREVIOUS_COMMIT succeeded. UAT is back on the previous known-good commit."
else
  log "CRITICAL: rollback to $PREVIOUS_COMMIT also failed health check. Manual intervention required."
fi

exit 1
