# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server on port 3000
npm run build    # Production build (outputs to dist/)
npm run preview  # Preview production build locally
```

There is no test suite. TypeScript checking is implicit via Vite/tsc (no `noEmit` lint script).

## Architecture

**Stack:** React 19, TypeScript, Vite, Font Awesome (CDN). No CSS framework beyond inline Tailwind utility classes loaded via CDN in `index.html`.

### Core files

| File | Role |
|---|---|
| `types.ts` | `SkillType`, `SlemmingState`, `Level`, `GameState` enums/interfaces |
| `constants.tsx` | Physics constants, skill icons/colors/descriptions |
| `constants/levels.ts` | All 20 `Level` objects (tutorial → expert) |
| `engine/Slemming.ts` | Entity class — movement physics and per-skill state machine |
| `components/GameCanvas.tsx` | Canvas renderer, game loop, terrain management |
| `App.tsx` | Menu/HUD/win-loss UI, React game state, level unlock logic |
| `services/adviceService.ts` | Returns random Slime Lord quotes (stub for future AI advice) |

### Two-canvas rendering

`GameCanvas` keeps two `<canvas>` elements:
- **`terrainCanvasRef`** (hidden) — holds destructible terrain as drawn pixels. Solidity is checked by reading pixel alpha: `terrainData[index + 3] > 128`.
- **`canvasRef`** (visible) — cleared and redrawn each frame by compositing the terrain canvas + all entity drawings.

Terrain modification uses `destination-out` compositing to erase pixels (explosions/digging) and `fillRect` to add pixels (building).

### Game loop

`requestAnimationFrame` drives the loop inside `GameCanvas`. Each frame runs `gameSpeed` physics iterations (1×/2×/4× speed toggle), then draws once. `gameSpeed` is passed as a prop from `App`.

### Slemming state machine

Each `Slemming` instance owns its state (`SlemmingState`) and updates itself in `update()`. Key behaviors:
- Terrain solidity is passed in as `Uint8ClampedArray` each frame (from `getImageData`).
- `onTerrainChange(x, y, radius, remove)` callback lets Slemmings modify terrain during their own update (digging, building, exploding).
- CLIMBER/FLOATER are persistent skills stored in `s.skills: Set<SkillType>`; all other skills mutate `s.state`.

### React state vs refs

Mutable game objects (Slemming array, terrain canvas, spawn counter) live in `useRef` to avoid triggering re-renders on every frame. Only HUD-visible counters (`saved`, `dead`, `released`, `timeLeft`) are lifted into React `GameState` via callbacks.

### Level data

Levels use four procedural `layoutType` values (`PIT`, `STAIRS`, `DIVIDE`, `PILLARS`) that are drawn in the `useEffect` that initializes terrain. Some levels have inline overrides keyed by `level.id` inside those switch cases. Progress is persisted to `localStorage` under the key `slemmings_unlocked`.

### Deployment

Pushing to `main` triggers GitHub Actions → GitHub Pages at `https://pisberg.github.io/slemmings-game/`. The Vite `base` is set to `/slemmings-game/` in `vite.config.ts`.
