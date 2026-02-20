# Local Deployment Runbook

## Prerequisites
- Node.js 18+
- npm

## 1) Install dependencies
```bash
cd /Users/computer/kody-website/chain-split-halt
npm install
```

## 2) Run development server
```bash
npm run dev
```
Open `http://localhost:5173`.

## 3) Build production bundle
```bash
npm run build
```
Output is generated in `/Users/computer/kody-website/chain-split-halt/dist`.

## 4) Preview production build locally
```bash
npm run preview
```
Open the preview URL shown in terminal.

## 5) Sync shared mirror file (optional)
```bash
npm run sync:mirror
```

## Smoke test checklist
- Right panel is blurred before start.
- Scenario 1 card shows breathing `Start` indicator on first load.
- Left scenario cards are clickable and switch scenarios.
- `Chain Split Halt` toggle recomputes outcome immediately.
- Scenario 2 + ON can resolve via multi-round rotation.
- Scenario 3 + ON shows `No attestation (safety halt)`.
- `Validator outcome`, `Node details`, and `Slot trace` panels update consistently.
