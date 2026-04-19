#!/bin/bash
# Boveda Clean Startup Script
# Ecosystem ports: Boveda 5130, Ibis 5140, Òrò 5150, Sankoré 5160.

echo "Cleaning up conflicting processes..."
lsof -ti:5130,3005,3100 | xargs -r kill -9 2>/dev/null
sleep 2

echo "Starting Boveda on dedicated ports..."
echo "   - API: http://localhost:5130"
echo "   - Studio: http://localhost:3100"
echo ""

# Start in current directory
pnpm dev

# When you stop with Ctrl+C, cleanup
trap "echo 'Stopping Boveda...'; lsof -ti:5130,3100 | xargs -r kill -9 2>/dev/null" EXIT
