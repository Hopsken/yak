# Yak

A single-author digital garden on AT Protocol, built with Next.js SSR and React.
Articles live on your PDS, not in a Git repository. Yak uses Atcute for XRPC,
identity resolution, OAuth, and Standard.site schemas.

## Content and editing

- `site.standard.publication` identifies your blog and its canonical domain.
- `site.standard.document` stores article metadata, tags, and plaintext.
- `at.markpub.markdown` stores CommonMark. Bodies over 50 KB use a Markdown
  blob (maximum 1,000,000 bytes), with an inline preview.
- Tiptap provides basic rich-text editing, Markdown import/export, and preview.
- Private drafts remain in browser storage. Use **Restore draft** after reopening;
  export a backup before clearing browser data. Drafts do not sync across devices.
- Article links and tags form a derived, rebuildable backlink/topic index.
- Desktop links open stacked notes; URLs preserve the stack across reload/history.
- Images use Markdown URLs. Portable PDS body-image attachments are not implemented.

Publication is public. PDS records are not suitable for private drafts.
Only the configured owner DID can publish. Published paths cannot change in the
editor. Updates check the record CID to prevent silent overwrites.

## Local development (no real account)

Install [mise](https://mise.jdx.dev/getting-started.html), then run `mise trust`
and `mise install` for the pinned toolchains in `mise.toml`. Activate mise in
your shell, or prefix commands with `mise exec --`. Keep its pnpm version and
the `packageManager` field in `package.json` in sync.

Requirements: Node.js 22.12+, pnpm, OpenSSL. Browser checks use Playwright Test
with Chromium (`pnpm exec playwright install --with-deps chromium`). The isolated network contains a PDS, PLC, and local HTTPS proxy;
no AppView, Relay, Jetstream, public PLC, or production account is required.

```sh
pnpm install
# Add this local host entry once (see docs/development-network.md):
# 127.0.0.1 pds.yak.test
pnpm dev:network
```

Wait for `Yak test network ready`. In a second terminal:

```sh
# Only copy if no existing configuration will be overwritten:
cp -n .env.test-network .env.development.local
NODE_EXTRA_CA_CERTS=.yak/tls/pds-cert.pem pnpm dev
```

Open the local app at port 3000 using the `127.0.0.1` host. On `/admin`, either
use real local OAuth, or select **Development login** with no credentials.
The latter skips OAuth, not real PDS writes. Anyone who can access this development
app can log in as its test owner; keep it on a trusted local network or private portal.
The generated PDS password is a disposable secret; do not share or commit it.

Restarting the network creates new accounts. Merge the regenerated settings
into your development env file and restart Next.js. The PDS is ephemeral.
Read [development and test instructions](docs/development-network.md).

## Checks

```sh
pnpm lint
pnpm test
pnpm build
# With the isolated network and development app running:
pnpm test:network
pnpm test:browser
```

`test:network` checks auth boundaries, PDS round trips, SSR, backlinks, conflicts,
and large body blobs. `test:browser` completes real local HTTPS PDS OAuth,
Tiptap editing, draft restore, publishing, stacked links, and browser history.
These scripts publish only to the disposable local network.

## Production configuration

OAuth and publishing run on the server. Encrypted HttpOnly cookies hold OAuth
state (10 minutes) and the session (7 days); no database or persistent application
disk is required. Cookies use SameSite=Lax and Secure on HTTPS. Keep the encryption
secret stable across server instances and restarts. Yak is a public OAuth client:
no client signing key is needed. PKCE and DPoP still apply, and tokens remain
server-managed. Existing confidential-client sessions require a new login.

This is a single-author design: one pending login per browser, no distributed
refresh lock. Concurrent refreshes or stale cookies can require a new login.
Drafts remain in the browser. Logout attempts PDS token revocation and clears
local cookies even if revocation fails; a copied cookie may remain usable if the
PDS was unreachable. Cookies are encrypted and authenticated, not just encoded.

Each OAuth cookie must fit within 4096 bytes including attributes. Oversized
sessions produce an explicit error; cookie splitting is disabled. Token sizes
vary by PDS. Avoid untrusted scripts, and keep HTTPS and Origin checks enabled.

`OAuthStorage` in `src/lib/oauth-storage.ts` uses Atcute's `states`/`sessions`
store contract. The current cookie adapter accepts either a Web Request/Response
cookie jar or Next.js cookies. Replace `oauthStorage()` in `src/lib/auth.ts` to
connect a Worker Durable Object later; OAuth clients are request-scoped, never
global cookie singletons. Refreshing calls must run in response-writable routes,
not SSR components or background tasks. No Workers deployment adapter is included.
Application crypto and identity resolution use Web Crypto and DNS-over-HTTPS.

Copy `.env.example` and configure:

| Variable             | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `YAK_ORIGIN`         | Canonical HTTPS blog origin, no path               |
| `YAK_OWNER_DID`      | Stable owner DID, not a handle                     |
| `YAK_SESSION_SECRET` | Random secret, at least 32 characters; keep stable |

Serve `/oauth-client-metadata.json` publicly with `token_endpoint_auth_method: none`.
The PDS must be able to fetch this URL without a login wall.

Yak finds the owner's publication by its URL matching `YAK_ORIGIN`. If none
exists, publishing creates one with a PDS-assigned TID record key. Multiple
matches cause an error; Yak does not silently select or rewrite a publication.
New documents also receive PDS-assigned TID keys. Editing keeps the existing
record key and checks its revision CID. Duplicate paths are checked before
creation; simultaneous writes from separate server instances or external clients
are not serialized, so run a single editor instance for this single-author app.

Production resolves the PDS from the DID document. Development PDS/PLC overrides
and the shortcut login are ignored/disabled in production. Origin checks protect
mutating routes. OAuth callbacks additionally bind to the initiating browser.

Public reads use a 30-second revalidation interval; Yak publishes invalidate the
cache immediately. External edits/deletes appear after a subsequent revalidation.
Backlinks cover this owner's selected publication, not the entire ATProto network.
Monitor PDS availability and keep content backups; this version has no durable
offline article mirror.

Inspired by [Andy's working notes](https://notes.andymatuschak.org/).

## Contributors

Hopsken

## License

MIT License
