# Qualifications Vault

A personal site where anyone can sign in with Google, upload their certificates (PDF or image),
have the key details auto-read by AI, and keep a sortable, filterable list of what's active and
what's expired.

## Stack
- **Next.js 14** (App Router, TypeScript, Tailwind)
- **NextAuth.js** — Google OAuth
- **Prisma + SQLite** (swap to Postgres for production — one line in `prisma/schema.prisma`)
- **Anthropic API (Claude)** — reads uploaded certificates and pre-fills the form
- Local disk storage for uploaded files (swap for S3 / Cloudinary in production — see below)

## 1. Install
```bash
npm install
```

## 2. Set up Google OAuth
1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: **Web application**).
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local dev)
   - `https://yourdomain.com/api/auth/callback/google` (production)
4. Copy the **Client ID** and **Client Secret**.

## 3. Environment variables
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from step 2
- `ANTHROPIC_API_KEY` — from https://console.anthropic.com/settings/keys (powers the auto-fill)
- `WEBDAV_URL` / `WEBDAV_USERNAME` / `WEBDAV_PASSWORD` — your WebDAV server's own address and
  login (the same details you'd type into a WebDAV client's login screen — not a browser-based
  WebDAV client app's URL, which is a different thing sitting in front of the real server).
  `WEBDAV_BASE_PATH` is just the folder certificates get filed under; it's created automatically.

## 4. Set up the database
```bash
npx prisma db push
```
This creates `dev.db` (SQLite) with the `User` and `Qualification` tables.

## 5. Run it
```bash
npm run dev
```
Visit `http://localhost:3000`.

## How file storage works
Certificates are never handed to the browser directly — WebDAV files usually aren't public, and
this keeps them that way:
1. `/api/upload` saves the file straight to your WebDAV server (`src/lib/webdav.ts`) under
   `WEBDAV_BASE_PATH/<userId>/<generated-name>`. Only that path is stored in the database.
2. When someone clicks **Preview**, the browser requests `/api/files/<qualification id>`, which
   checks the file belongs to the signed-in user, fetches it from the WebDAV server on the
   server side, and streams it back. The WebDAV login never reaches the browser.
3. Deleting a qualification also deletes the file from the WebDAV server.

## How the AI pre-fill works
When someone uploads a certificate, `/api/upload`:
1. Uploads the file to WebDAV (above).
2. Sends it to Claude (`src/lib/ai-parse.ts`) with instructions to extract course name, issuer,
   level, issue date and expiry date (or flag it as non-expiring) as JSON.
3. Returns the parsed fields to the upload form, which the person can review and override before
   saving — nothing is written to the database until they confirm.

## Going to production
- **File storage**: already wired to WebDAV — just make sure the server is reachable from
  wherever you deploy (same network, or a public HTTPS address), and that its storage quota is
  big enough for everyone's certificates.
- **Database**: change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`, point
  `DATABASE_URL` at a real Postgres instance (Supabase, Neon, Railway all have free tiers), then
  run `npx prisma db push` again.
- **Sharing**: the Share button is intentionally disabled for now — it's ready to wire up to a
  future "generate a temporary view link" endpoint once you decide how public profile viewing
  should work.
- Set `NEXTAUTH_URL` to your real domain, and add that domain's callback URL in the Google
  Cloud Console.
