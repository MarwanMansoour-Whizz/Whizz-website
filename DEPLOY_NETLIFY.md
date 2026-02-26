# Deploying the Whizz Website on Netlify

Yes, you can use **Netlify**. Netlify runs your app on serverless/edge, so the database cannot be a local SQLite file. Use a **hosted database** (e.g. **Neon Postgres**, free tier).

---

## 1. Create a database (Neon)

1. Go to [neon.tech](https://neon.tech), sign up, create a project.
2. Copy the **connection string** (e.g. `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

---

## 2. Switch Prisma to Postgres

In **whizz-website**, edit `prisma/schema.prisma`:

- Change `provider = "sqlite"` to `provider = "postgresql"`.
- Keep `url = env("DATABASE_URL")`.

Example:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run migrations against Neon (from your machine, with Neon’s URL):

```bash
cd whizz-website
DATABASE_URL="postgresql://..." npx prisma migrate deploy
# or, to sync schema without migration history:
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## 3. Deploy on Netlify

1. Push your code to **GitHub** (or GitLab/Bitbucket).
2. Log in at [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
3. Connect your repo.
4. **Build settings:**
   - **Base directory:** `whizz-website` (if the repo root is the whole Whizz project).
   - **Build command:** `npm run build` (your `package.json` already has `prisma generate && next build`).
   - **Publish directory:** `.next` (Netlify’s Next.js runtime will use this; if you use the “Next.js on Netlify” detection, it may set this for you).

5. **Environment variables** (Site settings → Environment variables):

   | Variable         | Description |
   |------------------|-------------|
   | `DATABASE_URL`   | Your Neon Postgres connection string |
   | `WHIZZ_API_URL`  | Your Whizz API URL (e.g. Cloud Run) |
   | `SESSION_SECRET` | Long random string (e.g. `openssl rand -base64 32`) |

6. Deploy. Netlify will run `npm run build` and deploy the Next.js app.

---

## 4. After deploy

- Open the site URL and log in. If you didn’t set env password hashes, create the first admin user via the **Users** page (you’ll need at least one user in the DB – run the seed script locally with `DATABASE_URL` set to your Neon URL, or create a user via an API tool).
- Ensure **WHIZZ_API_URL** is correct so the Tools and proxy work.

---

## Summary

- **Yes, you can use Netlify** for the Whizz website.
- Use **Postgres (e.g. Neon)** instead of SQLite, and set **DATABASE_URL**, **WHIZZ_API_URL**, and **SESSION_SECRET** in Netlify’s environment variables.
