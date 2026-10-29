#!/usr/bin/env bash
set -e

echo "=== 1. Building Client ==="
cd client
npm install
node ./node_modules/vite/bin/vite.js build

echo "=== 2. Building Server ==="
cd ../server
npm install
node ./node_modules/typescript/bin/tsc

echo "=== Build Finished Successfully! ==="
