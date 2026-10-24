# PrishStar

[Live application](https://prishstar.srivastavaprisha29.workers.dev/)

## Stack

- React 19, TypeScript, Vinext, Vite
- Cloudflare Workers
- Cloudflare D1 (SQLite), Drizzle ORM
- Cloudflare R2
- GitHub Actions

## Architecture

`worker/index.ts` handles requests through Vinext. API routes store entry metadata in D1 and media objects in R2.

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Profile, stories, feed, journal, lists, reminders |
| `app/api/entries/` | Entry retrieval, creation, publication, deletion |
| `app/api/media/` | Uploads and byte-range media delivery |
| `app/api/owner/` | Owner authentication and logout |
| `app/api/session/` | Session status |
| `app/api/archive/` | Content export and import |
| `app/api/bridge/` | Authenticated cross-deployment transfer |
| `db/schema.ts` | Entry and login-attempt schemas |
| `drizzle/` | SQL migrations |
| `lib/` | Authorization, sessions, visibility, expiry, transfer |
| `scripts/` | Build, provisioning, deployment, verification |

## Content and media

Stories and feed posts publish on submission. Owners can unpublish or delete entries. Other entry types use an explicit publication setting.

- Stories expire after 24 hours.
- Feed posts expire after seven days.
- Upload limit: 95 MB per file; no application-level video duration limit.
- Formats: JPEG, PNG, WebP, GIF, MP4, WebM, MOV, Ogg video.
- Playback depends on browser codec support.
- Video uploads include a local preview and selectable cover frame.
- Soundtracks support audio upload, start/end selection, and independent music/video volume. Audio is stored separately in R2 and synchronized during playback.
- Media requests support byte ranges.
- Expiry blocks entry retrieval and media access; it does not physically delete stored records or objects.

## Authentication

The standalone deployment uses eight-hour signed owner sessions. Cookies use `Secure`, `HttpOnly`, and `SameSite=Strict`. Mutation routes enforce owner authorization and same-origin checks. Login attempts are rate-limited.

Public requests return published, unexpired entries and their associated media. Changing the owner password invalidates existing sessions.

The original hosting integration uses managed identity and `PRISHSTAR_OWNER_EMAIL`.

## Development

Requires Node.js 22.13+ and pnpm 11.25.0.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run dev
```

Local D1 schema initialization:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_slimy_spectrum.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_lucky_harrier.sql
```

Generate schema migrations with `pnpm run db:generate`. Local storage is separate from production.

## Deployment

`.github/workflows/deploy-cloudflare.yml` runs on pushes to `main` and manual dispatch.

Repository secrets:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |
| `CLOUDFLARE_API_TOKEN` | Scoped provisioning and deployment token |
| `PRISHSTAR_ADMIN_PASSWORD` | Owner password, minimum 20 characters |

The API token requires Workers Scripts Edit, D1 Edit, Workers R2 Storage Edit, and Account Settings Read. R2 and a Workers subdomain must be enabled.

The pipeline provisions `prishstar-db` and `prishstar-media`, builds with `vite.cloudflare.config.ts`, applies migrations, deploys the Worker, installs runtime secrets, and runs live API checks. Owner login is at `/owner`.

The default Vite configuration supports the original hosting integration. The standalone configuration targets the independent Cloudflare deployment.

### Cross-deployment transfer

The source host uses `PRISHSTAR_SYNC_SECRET` and `PRISHSTAR_SYNC_TARGET` to mirror uploads and entry changes to the standalone host. Both hosts authenticate bridge requests with the shared secret.

`scripts/source-bridge.mjs` decrypts `.openai/bridge.encrypted` using a private key stored in R2. `scripts/source-migrate.mjs` performs the initial transfer, preserves entry timestamps, and verifies public story/feed media. An R2 completion marker prevents repeated migration.

## Verification

```sh
node --experimental-strip-types --test tests/owner-session.test.mjs
pnpm run build
```

Deployment checks cover anonymous access restrictions, owner login, uploads, immediate story/feed publication, public media access, unpublishing, and deletion. Verification entries are removed after the checks.
