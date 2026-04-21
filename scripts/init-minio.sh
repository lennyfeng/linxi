#!/bin/bash
# Initialize MinIO bucket for local development
# Requires mc (MinIO Client) installed

set -e

MINIO_ENDPOINT=${MINIO_ENDPOINT:-http://localhost:9000}
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-minioadmin}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-minioadmin}
BUCKET_NAME=${MINIO_BUCKET:-internal-platform}

echo "Configuring MinIO alias..."
mc alias set local "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"

echo "Creating bucket: $BUCKET_NAME"
mc mb --ignore-existing "local/$BUCKET_NAME"

echo "Setting public read on /public prefix..."
mc anonymous set download "local/$BUCKET_NAME/public"

echo "MinIO initialization complete."
