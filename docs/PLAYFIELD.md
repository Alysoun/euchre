# Euchre ↔ Playfield

Euchre is a **consumer** of [`@playfield/core/euchre`](./playfield/packages/core). The React app should not duplicate engine logic.

## Layout

| Path | Role |
|------|------|
| `playfield/` | Vendored Playfield SDK (committed for GitHub Pages CI) |
| `src/types/GameTypes.ts` | Re-exports core types — no duplicate `GameState` |
| `@playfield/core/euchre` | Reducer, AI, trick play, constants, session repair |

## Local development (Games folder)

After editing `Games/playfield/`:

```bash
npm run sync-playfield
npm install
```

`npm run dev` / `npm test` / `npm run build` rebuild core via `predev` / `pretest` / `prebuild`.

## Before pushing

```bash
npm run sync-playfield   # when canonical SDK changed
npm run smoke
```
