#!/bin/bash
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Build complete!" 