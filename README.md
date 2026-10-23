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

## Hosting and access

The current deployment uses ChatGPT Sites with a Workers server, D1, and R2. `.openai/hosting.json` retains the existing Site identity and storage binding names. The GitHub repository is source control; it does not contain the production database or uploaded photos.

GitHub Pages cannot execute this app's server routes. A static export would lose its current persistence behavior.

The app has a public read-only visitor view and server-enforced owner editing. Sites supplies authenticated identity headers. The runtime secret `PRISHSTAR_OWNER_EMAIL` identifies the owner; it must be set by the hosting administrator and is never committed. Missing owner configuration denies all writes. Existing records default to private. Owners explicitly publish records from the entry form or entry controls. Anonymous media retrieval requires a live published entry linking that media.

The `/signin-with-chatgpt` route is provided by Sites. Moving this application to independently managed hosting requires replacing that identity integration with trusted authentication; never trust client-supplied identity headers on a standalone server. Do not deploy the app publicly on another host without that change.

## Data and secrets

Never commit credentials, `.env` files, `.dev.vars`, `.wrangler` state, journal exports, or personal uploads. Database backups and media backups need separate storage. The UI's JSON export includes media URLs, not the image files themselves.

## Verification

The application builds successfully. A local journal entry was saved and restored after reload. Automated browser and API coverage should be added as the application grows; there is no claim of a completed public-launch security review.
