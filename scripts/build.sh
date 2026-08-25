#!/bin/sh
set -eu

echo "Building ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
docker build -f Dockerfile -t "${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}" .
echo "Built ${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"
