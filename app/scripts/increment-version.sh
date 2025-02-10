#!/bin/bash

VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Enter version number (example: 1.0.0):"
    read VERSION
    
    if [ -z "$VERSION" ]; then
        echo "No version provided. Exiting..."
        exit 1
    fi
fi

echo "Updating to version: $VERSION"
npm version $VERSION && npx react-native-version --never-amend 