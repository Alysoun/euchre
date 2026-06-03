# GitHub Pages setup (Actions)

If the **deploy** job fails with `404` / `Failed to create deployment`, Pages is not configured for **GitHub Actions** yet.

## One-time fix

1. Open **https://github.com/Alysoun/euchre/settings/pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save if prompted.
4. Go to **Actions** → **Deploy to GitHub Pages** → **Re-run all jobs** (or push any commit to `main`).

After a successful run, the site is at **https://alysoun.github.io/euchre/** (note the `/euchre/` path).

## Do not mix deploy methods

- **CI (recommended):** push to `main` → workflow builds `dist` and deploys via Actions.
- **Manual:** `npm run deploy` pushes to the `gh-pages` branch. Only use that if you set Pages source to the `gh-pages` branch instead of Actions — not both.

## Permissions

The workflow needs `pages: write` and `id-token: write` (already set in `.github/workflows/deploy-pages.yml`). On a private repo, Pages may require a paid plan; public repos are free.
