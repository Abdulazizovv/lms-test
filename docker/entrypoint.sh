#!/bin/sh
set -e

mkdir -p /app/data
chown -R nextjs:nodejs /app/data

if [ -f /app/data-seed/tests.json ] && [ ! -f /app/data/tests.json ]; then
  cp /app/data-seed/tests.json /app/data/tests.json
fi

if [ -f /app/data-seed/branches.json ] && [ ! -f /app/data/branches.json ]; then
  cp /app/data-seed/branches.json /app/data/branches.json
fi

if [ -f /app/data-seed/results.json ] && [ ! -f /app/data/results.json ]; then
  cp /app/data-seed/results.json /app/data/results.json
fi

if [ ! -f /app/data/results.json ]; then
  echo "[]" > /app/data/results.json
fi

chown -R nextjs:nodejs /app/data

exec su-exec nextjs:nodejs "$@"
