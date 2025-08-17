# Fictional Sniffle

A Vite-powered React + TypeScript single-page app. The project is preconfigured with ESLint, Prettier, and strict TypeScript settings. Core libraries like Dexie for IndexedDB, Framer Motion for animations, and Mozilla Readability are included.

## Development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` – start dev server
- `npm run build` – type-check and build for production
- `npm run lint` – run ESLint
- `npm run format` – format with Prettier
- `npm run size` – check bundle size against budget

## Folder Structure

```
src/
  app/
  features/
  lib/
```

## CI

GitHub Actions runs lint and build on pushes and pull requests to `main`.

## Performance Budgets

- Largest Contentful Paint (LCP) under 2.5s on Fast 3G emulation
- Initial JavaScript payload under 150KB gzipped
