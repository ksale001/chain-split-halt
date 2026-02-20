# Chain Split Halt Walkthrough

Interactive React/Vite walkthrough that explains how Obol's `chain_split_halt` behavior changes validator outcomes across three deterministic scenarios.

## What this repo contains
- Production UI app in `src/`
- Product and UX design artifacts in `mxe_artifacts/`
- Internal context docs used for copy/mechanics alignment

## Tech stack
- React 18
- Vite 5
- Tailwind CSS 3
- Lucide icons

## Quick start
```bash
npm install
npm run dev
```
Open `http://localhost:5173`.

## Scripts
- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run preview`: preview production build
- `npm run check`: build check (CI-friendly)
- `npm run clean`: remove `dist/`
- `npm run sync:mirror`: sync `chain_split_halt_landing_page.jsx` from app source

## Current product model
- Fixed cluster size: 4 nodes
- Fixed consensus threshold: 3/4
- Scenarios:
1. Healthy network
2. One node on a different chain
3. Contentious fork (2v2)

## Project structure
```text
.
├── src/
│   ├── ChainSplitHaltLandingPage.jsx
│   ├── main.jsx
│   └── index.css
├── mxe_artifacts/
│   ├── 01-thesis.md
│   ├── 02-experience-design.md
│   ├── 03-context-pack-spec.md
│   ├── 04-measurement-spec.md
│   ├── 05-build-acceptance-tests.md
│   └── 06-ui-implementation-checklist.md
├── scripts/
│   └── sync-mirror.mjs
├── chain_split_halt_landing_page.jsx
├── LOCAL_DEPLOY.md
├── internal_context.md
└── mxe_framework.md
```

## Workflow conventions
- Edit production UI in `src/ChainSplitHaltLandingPage.jsx`.
- Keep the shared mirror file updated with `npm run sync:mirror`.
- Keep artifact docs aligned with shipped UI behavior before major iterations.

## Deployment
See `LOCAL_DEPLOY.md` for local deployment and smoke test guidance.
