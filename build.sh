#!/usr/bin/env bash
set -e

echo "=== 1. Building Client ==="
cd client
npm install
npx vite build

echo "=== 2. Building Server ==="
cd ../server
npm install
npx tsc

echo "=== Build Finished Successfully! ==="
