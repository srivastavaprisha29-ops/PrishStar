# PrishStar

**Embracing my evil.**

A black-and-pink, starry journal about rage, defiance, and catharsis. Built for Prisha Srivastava.

## Features

- Editable profile and profile photo
- My Column: long-form posts with optional links to externally published articles
- Weekly updates and stories that expire after 24 hours
- Feed posts with image and video uploads, visible for seven days
- Editable retro reminder window that stays until changed
- Three catharsis lists and a bookshelf
- JSON export of journal records

## Stack

React 19, TypeScript, Vinext, Vite, Cloudflare Workers, D1 (SQLite via Drizzle), and R2 object storage.

Videos have no imposed duration limit. Uploads are limited to 95 MB. Playback depends on browser codec support; MP4 is recommended. Expiry removes stories and feed posts from retrieval and disables their media URLs. It is not a scheduled physical deletion of storage objects. Older database rows can remain stored.

## Local development

Use Node.js 22.13 or newer and the pnpm version declared in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_slimy_spectrum.sql
pnpm run dev
```

Apply the initial migration once per local database. Future schema changes require a new migration (`pnpm run db:generate`). Never edit an already applied migration. Local databases and uploads are separate from production.

## Deploy from GitHub to your Cloudflare account

The `Deploy PrishStar to Cloudflare` GitHub Actions workflow deploys this application without installing the Cloudflare GitHub App. It runs on pushes to main when credentials are configured, and can also be started manually.

1. In Cloudflare, enable R2 for the account if you have not already done so. Choose a Workers subdomain if your account has none. Any billing setup remains your choice; the workflow does not enable R2 billing for you.
2. Create a scoped Cloudflare API token for this account with **Workers Scripts: Edit**, **D1: Edit**, **Workers R2 Storage: Edit**, and **Account Settings: Read** permissions. Do not use a Global API Key.
3. In this repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Your scoped Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Your 32-character Cloudflare account ID |
| `PRISHSTAR_ADMIN_PASSWORD` | A unique, randomly generated owner password of at least 20 characters |

4. Open **Actions → Deploy PrishStar to Cloudflare → Run workflow** on `main`.
5. When deployment completes successfully, the workflow summary provides the verified `workers.dev` live URL. Share that URL and the GitHub repository URL on LinkedIn. No live URL exists for this deployment until that run succeeds.
6. Visit `/owner` on your new live site and use the owner password to sign in. Check **Publish to visitors** when saving an entry, or use its **publish** control afterward. Existing private entries remain private.

The workflow creates or reuses `prishstar-db` (D1) and `prishstar-media` (R2), applies migrations, builds the standalone Worker, and deploys it. It then installs the owner password as a Cloudflare runtime secret and checks the public homepage, reader role, and blocked anonymous writes. Run summaries do not contain the token or password. Keep the token and password in encrypted GitHub secrets only; never paste them into chat or commit them.

This creates a separate database and media bucket in your account. Existing entries and uploads on the original Sites host are not migrated automatically. The original Sites integration remains supported by the default Vite configuration, while `vite.cloudflare.config.ts` produces the independent Cloudflare build. GitHub Pages cannot run these server routes.

## Access control

Public visitors can only retrieve explicitly published, unexpired entries and their associated media. The standalone host uses an eight-hour signed owner session cookie with Secure, HttpOnly, and SameSite=Strict flags, server-side authorization, same-origin mutation checks, and login attempt limits. Changing the owner password invalidates existing sessions. Standalone deployments ignore incoming ChatGPT identity headers.

The original Sites host can continue to use its hosting-managed identity with the `PRISHSTAR_OWNER_EMAIL` runtime secret. No owner credentials are committed to this repository.

## Data and secrets

Never commit credentials, `.env` files, `.dev.vars`, `.wrangler` state, journal exports, or personal uploads. Database backups and media backups need separate storage. The UI's JSON export includes media URLs, not the image files themselves.

## Verification

The application builds successfully. A local journal entry was saved and restored after reload. Automated browser and API coverage should be added as the application grows; there is no claim of a completed public-launch security review.
