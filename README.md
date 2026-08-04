# MindForge

A free, ad-free puzzle app with **100 puzzles** across math, science, history, and computer science — designed for ages 7 to 35.

## Features

- **4 topics**: Math, Science, History, Computer Science (25 puzzles each)
- **3 difficulty levels**: Easy (free), Medium, Hard (unlock by completing puzzles)
- **Progress tracking**: Saved locally in your browser
- **Hints & explanations**: Learn from every answer
- **No ads, no accounts**: 100% free

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Deploy publicly

MindForge is a static site — deploy the `dist` folder to any host below.

### Option 1: Vercel (recommended, ~2 minutes)

1. Push this project to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite — click **Deploy**. No config changes needed.

Or from the terminal (after [installing Vercel CLI](https://vercel.com/docs/cli)):

```bash
npm run deploy:vercel
```

### Option 2: Netlify

1. Push to GitHub, then go to [app.netlify.com/start](https://app.netlify.com/start).
2. Import the repo — `netlify.toml` is already configured.

Or via CLI:

```bash
npm run deploy:netlify
```

### Option 3: GitHub Pages

1. Push to GitHub on the `main` branch.
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Push to `main` — the included workflow deploys automatically.

Your site will be at `https://<username>.github.io/mindforge/`.

### Push to GitHub (first time)

Install [Git](https://git-scm.com/download/win), then:

```bash
cd C:\Users\shakh\Projects\mindforge
git init
git add .
git commit -m "Initial commit: MindForge puzzle app"
gh repo create mindforge --public --source=. --push
```

If you don't have GitHub CLI (`gh`), create a repo at [github.com/new](https://github.com/new) named `mindforge`, then:

```bash
git remote add origin https://github.com/<your-username>/mindforge.git
git branch -M main
git push -u origin main
```

## Unlock rules

- **Easy** — available immediately
- **Medium** — unlock after completing 15 easy puzzles
- **Hard** — unlock after completing 15 medium puzzles

Progress is stored in `localStorage` under the key `mindforge-progress`.
