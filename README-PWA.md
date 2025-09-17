# PWA Upgrade Applied

This project was patched to support Progressive Web App (PWA) features using **next-pwa**.

## What was added
- `next.config.mjs` with next-pwa config (enabled only in production).
- `public/manifest.webmanifest` + placeholder icons in `public/icons/`.
- `components/ReloadPrompt.tsx` to show an in-app update banner when a new SW is available.
- Offline fallback page at `/offline`.
- Patched `app/layout.tsx` to include manifest and render `<ReloadPrompt />` (if present).

## How to run (production)
```bash
npm install
npm run build
npm run start
```
Then open the app and **Install** it from the browser menu (Add to Home Screen / Install App).

## Notes
- In development, next-pwa is disabled by default, which is expected. To enable in dev, set `disable: false` inside `next.config.mjs`.
- Your previous `next.config.*` (if any) was backed up with `.backup__by_pwa` suffix.
