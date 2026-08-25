#!/bin/sh
set -eu

echo "Building ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
docker buildx build \
    --provenance=false \
    --sbom=false \
    --push \
    -f Dockerfile \
    -t "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" \
    .
echo "Pushed ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
