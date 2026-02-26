# Push whizz-website to GitHub

Run these commands **from the whizz-website folder** in your terminal.

## 1. Initialize git and first commit

```bash
cd /Users/marwanwhizz/Desktop/Whizz/whizz-website

git init
git add .
git commit -m "Initial commit: Whizz website (Next.js, Prisma, Neon)"
```

## 2. Create the repo on GitHub

1. Go to [github.com/new](https://github.com/new).
2. **Repository name:** e.g. `whizz-website` (or any name you like).
3. Choose **Public** (or Private).
4. **Do not** add a README, .gitignore, or license (you already have them).
5. Click **Create repository**.

## 3. Add remote and push

GitHub will show you commands; use these (replace `YOUR_USERNAME` and `REPO_NAME` with your GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

**Example** if your username is `marwanwhizz` and repo is `whizz-website`:

```bash
git remote add origin https://github.com/marwanwhizz/whizz-website.git
git branch -M main
git push -u origin main
```

---

**Note:** `.env` and `.env.local` are in `.gitignore`, so your Neon connection string and secrets will **not** be pushed. Set them in Netlify’s environment variables after you connect the repo.
