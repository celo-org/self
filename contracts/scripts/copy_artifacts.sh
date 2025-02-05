#!/bin/bash
SRC_DIR="./artifacts"
DEST_DIR="../sdk/backend-api/artifacts"

mkdir -p "$DEST_DIR"

cp -r "$SRC_DIR"/* "$DEST_DIR/"

echo "Artifacts copied from $SRC_DIR to $DEST_DIR."