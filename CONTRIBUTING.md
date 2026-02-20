# Contributing

## Development setup
1. Install Node.js (recommended via `.nvmrc`).
2. Install dependencies:
```bash
npm install
```
3. Start dev server:
```bash
npm run dev
```

## Working agreement
- Treat `src/ChainSplitHaltLandingPage.jsx` as the source of truth for the product UI.
- Keep `chain_split_halt_landing_page.jsx` synced when UI changes:
```bash
npm run sync:mirror
```
- Keep `mxe_artifacts/` aligned with shipped behavior when UX logic changes.

## Quality checks
Before handing off changes:
```bash
npm run check
```

## Copy and product integrity
- Keep cluster constants fixed unless product direction changes:
- Cluster size = 4
- Threshold = 3/4
- Preserve scenario naming consistency:
1. Healthy network
2. One node on a different chain
3. Contentious fork (2v2)
