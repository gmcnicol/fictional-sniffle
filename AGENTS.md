# AGENTS.md — Zero‑Tolerance UX Upgrade for the RSS Web Comics Reader

This document updates our agent responsibilities and raises the quality bar. **A poor UI/UX is not an option.** All work MUST meet the quality gates below or the PR is rejected by CI. There is no “we’ll tidy this later.”

## Zero‑Tolerance UX Principle

- The reader is the product. Comics must **load fast**, **center perfectly** (horizontal & vertical), and **render alt text** beneath the image every single time. Any jitter, layout shift, or broken caption is a defect.
- Visual style is **muted**, system-dependent theme (prefers-color-scheme): slightly lighter dark on darker background (dark mode); the inverse for light. No neon, no busy gradients, no novelty fonts.
- Obvious, consistent controls. Minimal chrome, maximum reading focus.

## Quality Gates (Non‑Negotiable)

Every PR must pass these **blocking** checks in GitHub Actions:

1. **Type Safety:** `npm run typecheck` (TS strict) — 0 errors.
2. **Lint & Format:** `npm run lint` (ESLint) + `npm run format:check` (Prettier) — 0 errors.
3. **Unit Tests:** `npm test -- --coverage` — **80%+ overall**, **90%+** for core modules (`reader`, `content-extraction`, `feed-parse`, `rules`).
4. **E2E Tests (Playwright):** Core flows (reader centering & alt text, auto mark‑as‑read + undo, keyboard nav, OPML import/export, offline read) — all green.
5. **Accessibility:** axe checks pass (`aria`, roles, focus, skip links). No WCAG AA failures for text contrast.
6. **Performance (Lighthouse CI, mobile config):** LCP **≤ 2.5s**, TTI **≤ 3.0s**, Performance score **≥ 90**, CLS **≤ 0.1** on the Reader route.
7. **Bundle & Assets:** Initial JS **≤ 150KB gzip**, images lazy & async decode, no layout shift for hero image (aspect-ratio boxes).
8. **PWA/Offline:** App shell + last N articles & images available offline; LRU eviction enforced.
9. **Security/Sanitization:** DOMPurify applied to all Readability HTML; no unsafe HTML injections.

**Deviation from any gate = automatic CI failure and PR rejection.**

## Agents (updated scope)

### Agent 1 — Visual System & Theming

Owns tokens, typography, color, spacing, surfaces. Ensures muted themes and perfect centering primitives. Delivers design tokens (`tokens.css`), component library (`Panel`, `Toolbar`, `Button`, `ListItem`), and layout utilities.

### Agent 2 — Reader Experience

Owns the Reader route. Guarantees image centering (both axes), alt text caption, zoom/pan ergonomics, scroll restoration, and no layout shift. Integrates keyboard shortcuts and auto mark‑as‑read.

### Agent 3 — Content Extraction

Owns Readability worker, DOMPurify sanitization, image heuristics, and domain rules JSON (xkcd, SMBC, etc.). Ensures main image + caption fidelity when RSS lacks good content.

### Agent 4 — Feeds & OPML

Owns add/edit/remove feeds, folders/tags, OPML import/export, discovery for `<link rel="alternate">`. Guarantees dedupe and correct unread counts.

### Agent 5 — Networking & Resilience

Owns fetch/parse, ETag/Last‑Modified, backoff, CORS messaging, and per‑feed error surfaces. No silent failures.

### Agent 6 — A11y & Internationalization

Owns roles/landmarks, keyboard navigation, reduced motion handling, and message catalog prep. Ensures axe checks pass.

### Agent 7 — Performance & Offline

Owns Lighthouse budgets, code splitting, image policies, Workbox caching strategy, and LRU eviction.

### Agent 8 — CI/CD & QA

Owns GitHub Actions workflow, test orchestration (unit/e2e/axe/LHCI), artifacts, and QA/UAT playbooks.

## Definition of Done (DoD)

A task is DONE only if:

- All gates above pass in GitHub Actions for Node 20 on Ubuntu latest.
- Docs (README/CHANGELOG) are updated.
- Screenshots for Reader centering & alt caption are attached to the PR.
- No TODO/FIXME left behind.
