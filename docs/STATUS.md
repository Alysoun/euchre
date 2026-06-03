# Euchre — status

**Version:** Playfield consumer v0.1  
**Live:** https://alysoun.github.io/euchre/

## Shipped

- Headless engine in `@playfield/core/euchre` (`euchre/playfield/`)
- React app wired to vendored SDK
- Pre-push gate: `npm run smoke`
- Docs: [PLAYFIELD.md](PLAYFIELD.md)

## Engine changes

Edit canonical SDK at `Games/playfield/`, then:

```bash
npm run sync-playfield
npm run smoke
git add playfield/
```

## Deploy

```bash
npm run deploy
```

Requires `gh-pages` and GitHub Pages enabled on the repo.
