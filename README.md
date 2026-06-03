# Euchre

Browser-based **Euchre** — four players, you and a partner vs two opponents (AI). First team to **10** wins.

Engine: [`@playfield/core/euchre`](./playfield/packages/core) (vendored under `playfield/`).  
Live: https://alysoun.github.io/euchre/

## First-time setup

From `Games/Euchre/`:

```bash
npm install
```

If `playfield/` is missing (fresh clone without vendored SDK):

```bash
npm run sync-playfield
npm install
```

## Run locally

```bash
npm run dev
```

Vite opens **http://localhost:5173/euchre/** (port may differ if 5173 is busy).  
Always use the URL that includes **`/euchre/`** — the app is built for GitHub Pages under that path.

1. Enter your name → **Start game**
2. **Order up** / **Pass** (or name trump in round 2)
3. Play cards from the bottom panel when it is your turn
4. **Next hand** on the summary modal; **Leave Table** (top right) to return to setup

Optional dev overrides: copy `src/debug.example.ts` → `src/debug.ts` (gitignored).

## Verify before push

```bash
npm run smoke
```

## Deploy (GitHub Pages)

```bash
npm run deploy
```

Push `main` with `dist` deployed via `gh-pages`, or use the repo’s Actions workflow.

## Tests

```bash
npm test
```

Includes a full all-AI playthrough to catch stuck games.

## Save / resume

In-progress games persist in `localStorage` (`euchre-active-session`) until **Leave Table** or **game over**. Old Tripoley saves are ignored.

## Docs

- [docs/PLAYFIELD.md](docs/PLAYFIELD.md) — SDK sync workflow  
- [docs/STATUS.md](docs/STATUS.md) — release status  

## Rules (v0.1)

24-card deck, order up / name trump, dealer discard, follow suit with bowers, score to 10.

Not yet: going alone, stick-the-dealer, layout editor UI.
