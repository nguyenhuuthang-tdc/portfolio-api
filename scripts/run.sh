#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${TARGET_DIR:?TARGET_DIR is required}"

if [[ ! -f "${TARGET_DIR}/.env" ]]; then
  echo "Missing ${TARGET_DIR}/.env — create it on the VPS from .env.example"
  exit 1
fi

mkdir -p "${TARGET_DIR}/uploads" "${TARGET_DIR}/mysql_data"

cd "${TARGET_DIR}"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

echo "Pulling ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
"${COMPOSE[@]}" pull
"${COMPOSE[@]}" up -d --no-build
echo "Deployed ${DOCKER_CONTAINER_NAME:-portfolio-api} (${DOCKER_IMAGE_TAG})"
