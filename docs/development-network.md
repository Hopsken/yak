# Isolated development and tests

`pnpm dev:network` starts official `@atproto/dev-env@0.6.4`
`TestNetworkNoAppView`: an in-memory PLC and temporary SQLite/blob PDS. It creates
owner and non-owner test accounts, a Standard.site publication, and a Markpub
article. No service connects to the public PLC or a real account.

## Start

Install dependencies with `pnpm install`. Use Node.js 22.12+ and OpenSSL.
Add `127.0.0.1 pds.yak.test` to your system hosts file. Then:

```sh
pnpm dev:network
```

Wait for the ready message before reading `.env.test-network`. The script writes
it atomically with mode 0600; passwords/tokens are not printed. The endpoints are:

- PDS XRPC: `http://127.0.0.1:2582`
- local PLC: `http://127.0.0.1:2583`
- PDS OAuth/TLS proxy: `https://pds.yak.test:2584`
- Yak: `http://127.0.0.1:3000`

Atcute's server OAuth client requires an HTTPS PDS, even for a loopback client.
The script generates a local certificate in `.yak/tls/`. Node must trust this
certificate **before startup**; setting NODE_EXTRA_CA_CERTS in a Next.js dotenv
file alone is too late. Do not disable TLS verification globally.

```sh
cp -n .env.test-network .env.development.local
NODE_EXTRA_CA_CERTS=.yak/tls/pds-cert.pem pnpm dev
```

If the destination env file already exists, merge the generated values instead.
Each network restart changes accounts and secrets. Stop the app, merge the new
values, then restart it. Certificates expire after 30 days; stop the services,
remove only `.yak/tls/pds-cert.pem` and `pds-key.pem`, then restart to regenerate.

For manual OAuth, trust the test certificate in the browser or explicitly accept
the local certificate warning. Automated browser tests ignore certificate errors
only in their disposable Chromium session. The app itself still verifies TLS.

On `/admin`, select **Development login** with no credentials.
It creates a signed/encrypted Yak session and authenticates
to the real local PDS with the generated account. It does not fake OAuth tokens.
The route is POST-only, checks Origin, requires a loopback PDS, and returns 404
in production even if development variables were accidentally supplied.
Anyone with access to the development app can become its test owner. Keep the
app on a trusted local network or private portal.

## Verification

```sh
pnpm test
pnpm test:network
pnpm test:browser
```

The latter two require the running network and app. `test:browser` uses the
project's Playwright Test dependency. Install its browser once with
`pnpm exec playwright install --with-deps chromium`. It creates and closes an
isolated browser context per test. Traces, screenshots, and video are disabled
because OAuth traffic contains credentials and tokens. Do not enable or share
these recordings without reviewing their sensitive contents.
Both tests create public records only in this disposable PDS. Restart the network
to reset all test data. Never point these scripts at a production server.

Local loopback OAuth validates real authorization, PKCE/DPoP via the SDK,
callback/session handling, and OAuth writes. It is not a substitute for checking
your deployed HTTPS public-client metadata, reverse proxy cookie/header
limits, and callback cookies before exposing a production editor. Browser tests
also measure real OAuth cookie sizes, force token refresh, and verify logout and
failed-refresh handling. Existing filesystem OAuth sessions are no longer read;
log in again after upgrading. Development TLS certificate files are still needed
by the disposable PDS proxy, not by Yak's production session storage.

## Amp orbs

Run the local test network and app as supervised services:

```sh
amp orb service start yak-network --command 'pnpm dev:network'
# Wait for its ready log, then merge .env.test-network as above.
amp orb service start yak \
  --command 'NODE_EXTRA_CA_CERTS=.yak/tls/pds-cert.pem pnpm dev --hostname 0.0.0.0' \
  --port 3000
```

Preview and tests use separate app processes and configuration. Keep the test
app's `YAK_ORIGIN` at `http://127.0.0.1:3000`. For a portal preview, use a separate
checkout with its own development env file and port, start its supervised service
with `--portal`, then set its `YAK_ORIGIN` to the returned portal origin and
restart that service. Do not change the test app's configuration for preview.

Each app accepts mutating requests only from its own `YAK_ORIGIN`. Next.js also
uses that hostname for its development-server origin allowlist; this does not
grant any additional origins access to the application API. A preview publication
must match the preview's origin, independently of the local test publication.

A remote browser cannot use the orb's loopback OAuth callback. Use the shortcut
login with disposable PDS credentials for portal previews and the orb's browser
for local OAuth tests. An Amp
portal behind a login wall is not a publicly discoverable OAuth metadata host.

No Jetstream or Relay is started: Yak reads the selected owner's PDS directly.
The official dev-env helpers are test infrastructure, not a stable application
dependency. Their version is pinned and all usage stays in the network script.
