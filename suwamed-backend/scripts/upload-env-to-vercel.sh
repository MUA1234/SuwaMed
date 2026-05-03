#!/usr/bin/env bash
set +e

cd "$(dirname "$0")/.." || exit 1

if [ ! -f .env ]; then
  echo ".env not found in $(pwd)" >&2
  exit 1
fi

while IFS='=' read -r name value || [ -n "$name" ]; do
  name="${name%$'\r'}"
  value="${value%$'\r'}"
  case "$name" in '' | '#'*) continue ;; esac
  if [ -z "$value" ]; then
    echo "SKIP empty: $name"
    continue
  fi
  echo "Uploading $name..."
  printf '%s' "$value" | npx vercel env add "$name" production --force
done < .env

echo ""
echo "Done. Run: npx vercel --prod"
