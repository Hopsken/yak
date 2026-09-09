#!/usr/bin/env bash
set -euo pipefail

repo=$(pwd)
: "${PUBLIC_URL:?Start this script with amp orb services ensure}"
: "${PORT:?The portal service must supply PORT}"

# The network writes its environment atomically after seeding. Confirm that
# the seed is readable so stale credentials from an earlier network are ignored.
ready=false
for ((attempt = 0; attempt < 60; attempt++)); do
  if [[ -f .env.test-network ]]; then
    set -a
    source .env.test-network
    set +a
    if [[ ${YAK_PDS_URL:-} == http://127.0.0.1:2582 && -n ${YAK_SEED_RKEY:-} ]] &&
      curl --fail --silent --max-time 2 --output /dev/null \
        "$YAK_PDS_URL/xrpc/com.atproto.repo.getRecord?repo=$YAK_OWNER_DID&collection=site.standard.document&rkey=$YAK_SEED_RKEY"; then
      ready=true
      break
    fi
  fi
  sleep 1
done
if [[ $ready != true ]]; then
  echo 'The disposable PDS is not ready. Check yak-network service logs.' >&2
  exit 1
fi

# Keep Next.js output and generated types outside the test app's checkout.
# Restart yak-preview after source changes to refresh this snapshot.
preview=$(mktemp -d /tmp/yak-preview.XXXXXX)
trap 'rm -rf "$preview"' EXIT
cp -a src public package.json pnpm-lock.yaml tsconfig.json next.config.mjs \
  postcss.config.mjs tailwind.config.ts yak.config.ts "$preview/"
ln -s "$repo/node_modules" "$preview/node_modules"
export YAK_ORIGIN="$PUBLIC_URL"
cd "$preview"
node "$repo/node_modules/next/dist/bin/next" dev --webpack --hostname 0.0.0.0 --port "$PORT"
