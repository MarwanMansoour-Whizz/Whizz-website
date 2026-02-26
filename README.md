# Whizz Internal Dashboard

Internal web app for Whizz Marketing Solutions: login (admin, ziad, amira, may, maysara, heba), 5 feature UIs that call the Whizz API via a proxy (with audit logging), and an audit dashboard (admin, ziad, and heba only).

## Setup

1. **Install dependencies**
   ```bash
   cd whizz-website
   npm install
   ```

2. **Environment**
   - Copy `.env.local.example` to `.env.local`
   - Set `WHIZZ_API_URL` to your deployed Whizz API base URL (e.g. `https://whizz-api-xxxxx.run.app`)
   - Set `SESSION_SECRET` to a long random string (e.g. 32+ chars)
   - Set `DATABASE_URL` — for local dev use `"file:./dev.db"` (SQLite). For production you can use Postgres.
   - Generate password hashes for all 6 users and set in `.env.local` (use base64 to avoid `$` issues: `node scripts/hash-password-b64.js "password"`):
     - `ADMIN_PASSWORD_HASH`, `ZIAD_PASSWORD_HASH`, `AMIRA_PASSWORD_HASH`
     - `MAY_PASSWORD_HASH`, `MAYSARA_PASSWORD_HASH`, `HEBA_PASSWORD_HASH`

3. **Database**  
   Ensure `DATABASE_URL` is set (e.g. in `.env` or `.env.local`). Then:
   ```bash
   npx prisma migrate dev
   ```
   This creates the SQLite DB and the `AuditLog` table. (If the migration folder already exists, `migrate dev` applies it.)

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`. Sign in as `admin`, `ziad`, `amira`, `may`, `maysara`, or `heba` (with the passwords you hashed). Then use the Tools to run reports; each use is logged. **Admin**, **ziad**, and **heba** can open **Audit** to see usage by user and by feature.

## Build and deploy

```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any Node host. Set all env vars (including `WHIZZ_API_URL`, `SESSION_SECRET`, `DATABASE_URL`, and all six `*_PASSWORD_HASH`). For serverless hosts, use a hosted database (e.g. Postgres) for `DATABASE_URL` so the audit log persists. HTTPS is provided by the host.

## Security

- Passwords are stored only as bcrypt hashes; never log or expose plain passwords.
- The Whizz API is called only from the server (proxy); no API keys in the browser.
- Audit dashboard is restricted to users `admin`, `ziad`, and `heba`; `amira`, `may`, and `maysara` cannot access `/audit`.
