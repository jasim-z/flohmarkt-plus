#!/bin/bash

# Set environment variables to disable file watching
export WATCHPACK_POLLING=false
export CHOKIDAR_USEPOLLING=false
export NEXT_WATCH_IGNORE="next.config.ts,next.config.js,next.config.mjs"

# Start Next.js dev server
exec next dev -H 0.0.0.0 --no-lint
