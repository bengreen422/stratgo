#!/bin/bash
set -e  # Exit on any error

echo "=== Starting build process ==="
echo "Current directory: $(pwd)"
echo "Listing current directory:"
ls -la

echo "=== Changing to frontend directory ==="
cd frontend
echo "Frontend directory: $(pwd)"
echo "Listing frontend directory:"
ls -la

echo "=== Installing dependencies ==="
npm install

echo "=== Checking available scripts ==="
npm run

echo "=== Building the application ==="
npm run build

echo "=== Build complete! ==="
echo "Build output directory:"
ls -la build/ 