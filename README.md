# Zyven — The Infinite Profile

Zyven is one identity expressed through an endless sequence of **states**. It is an exploration system, not a portfolio: there is no final page, only the next state.

## How it works
- **State engine.** Every state is a BigInt (1 to 40 digits). `build(n)` derives a **DNA** (layout, typeface, density, glow), picks 3–4 dimensions from a pool (Identity, Thought, Idea, Concept, Question, Principle, Artifact, Experiment, Discovery, Unknown, Quote, Project, Timeline) and generates each one. A connected chain (Idea → Project → Discovery → Concept → Future) links every state to other states.
- **Deterministic.** The state number plus a fixed Zyven constant seed a small PRNG (sfc32); each section has its own sub-seed. Same number, same state, on any device. Nothing is stored or pre-generated; only the last 64 states are cached in memory.
- **Direct access / sharing.** `?state=18472` rebuilds state 18472 directly. Library → Share, Copy link, Copy ID. Search accepts numbers ("state 18472") or keywords; a keyword is hashed to a state, so a search always lands somewhere.
- **Modes.** Discover follows the graph on Continue. Deep reveals seven layers of the current state one at a time. Futures and unknowns are labelled as possibilities.
- **Controls.** Arrow keys, Space/Enter; swipe left/right (next/previous), up (deeper), down (return).
- **Local data.** Saved states and recent history live in `localStorage` (validated on read).
- **Offline.** `sw.js` caches the shell; after one online visit it runs offline. Install it as a PWA over HTTPS.

## Add content
Create `content.json` beside `index.html`: `{"n":["new noun"],"a":["new adjective"],"v":["new verb phrase"]}`. Strings are rendered with `textContent`. Appending words changes which words existing states pick, so treat additions as a new "universe version". For new dimensions, add templates to `T` in `script.js`.

## Run and deploy
Serve the folder statically (`python3 -m http.server`) and open localhost. Deploy the folder as-is to GitHub Pages, Netlify, Vercel or Cloudflare Pages. Bump `CACHE` in `sw.js` when you ship changes.

## Extend
The engine (`Rng`, `build`, `section`) is separate from rendering (`render`, `renderDeep`), so new interfaces or generators can reuse it.
