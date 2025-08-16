# Agents Overview — RSS Web Comics Reader (SPA)

This document defines the system as a set of “agents” (clear ownership areas) so an AI assistant or contributor can work in parallel with minimal collisions. The app is a **static single-page app** (SPA) deployable on **GitHub Pages**. Tech: **TypeScript + React + Vite**, **Dexie (IndexedDB)** for storage, **Framer Motion** for subtle animations, **Mozilla Readability** for full-content extraction (when CORS permits), and a **Service Worker** for offline reads. The default theme follows the user’s system preference (prefers-color-scheme) with a muted palette (slightly lighter dark on darker background, and vice versa for light).

## High-level Goals
- **Great web comic reading experience**: center images both horizontally and vertically, render alt text under images (e.g., xkcd’s secondary punchline).
- **Feed management**: add/edit/remove feeds, folder tags, sort, **OPML import/export**.
- **Content extraction**: display the main image or the full article when feasible. Respect RSS/Atom content first; otherwise attempt site fetch + Readability. Handle CORS gracefully (fallbacks, user guidance).
- **Automatic marking as read** based on visibility / scroll threshold, with undo.
- **Local-first**: Dexie for articles, feeds, settings, and read states. No backend required.
- **Accessible and fast**: keyboard shortcuts, focus states, reduced motion settings.
- **Deployable on GitHub Pages**: simple pipeline from `main` branch.

---

## Agent 1 — UI/UX & Theming Agent
**Purpose:** Create the visual language and layout primitives: muted themes, spacing, typography, centered comic viewer, and responsive behavior.

**Inputs:** Design tokens, system theme (prefers-color-scheme), app settings.  
**Outputs:** A small design system (tokens + components), layout for reader/list, accessible color pairs.

**Key Responsibilities:**
- Define color tokens for light/dark, ensuring muted contrast while meeting WCAG AA for text.
- Implement system-dependent theme with CSS variables and media queries; provide an override.
- Reader surface that **centers comics** horizontally and vertically; fit-to-width with max zoom.
- Display alt text directly beneath the image when present (e.g., `title`, `alt`, or `img[title]`).

---

## Agent 2 — Storage & Models Agent (Dexie)
**Purpose:** Define Dexie schema, migrations, and data access patterns.

**Inputs:** Feeds (user-added or via OPML), fetched articles, read state events.  
**Outputs:** Dexie tables, typed repositories, query helpers.

**Key Responsibilities:**
- Tables: `feeds`, `articles`, `readState`, `settings`, `folders` (optional), `syncLog`.
- Indices for fast queries: by `feedId`, `publishedAt`, `read`.
- Migrations with versioning and data backfill rules.
- Import/export **OPML** for feeds and folders. Export local state (optional).

---

## Agent 3 — Networking & Fetch Agent
**Purpose:** Fetch and parse feeds/articles safely in a browser-only environment.

**Inputs:** Feed URLs, user-triggered refresh, background sync interval.  
**Outputs:** Parsed items, normalized article records, fetch diagnostics.

**Key Responsibilities:**
- Fetch RSS/Atom with CORS-aware strategies: direct fetch; if blocked, use XML via CORS-enabled endpoints (documented) or on-demand user-entered proxy (optional).
- Parse: support RSS 2.0, Atom 1.0, and common extensions (Media RSS). Extract `title`, `link`, `content:encoded`, `description`, `enclosures`, images.
- Normalize images: choose “main image” via heuristics (enclosure image > content:encoded first img > og:image when full page fetched).

---

## Agent 4 — Content Extraction Agent (Readability + Heuristics)
**Purpose:** Attempt to display **main image** or **complete article** from the parent site.

**Inputs:** Article `link` URLs, fetched HTML (when CORS allows), RSS-provided HTML/snippets.  
**Outputs:** Cleaned HTML, main image URL, alt text (when available).

**Key Responsibilities:**
- Use **Mozilla Readability** on fetched HTML to get article body; sanitize HTML for display.
- Heuristics for comics:
  - If page contains a single dominant `<img>` inside `<article>` or known comic containers, prefer it.
  - Pull `alt`/`title` attributes as “Alt text” caption.
- Maintain a per-domain rules map for popular comics (e.g., xkcd, SMBC) to grab the correct image if needed. Rules stored in JSON and versioned.

**Limitations & Fallbacks:**
- CORS may block full-page fetch. Fallback to RSS `content:encoded` or `description`. If neither yields a main image, show a prominent “Open Original” button.

---

## Agent 5 — Reader & Interaction Agent
**Purpose:** Implement the reading experience and read-state logic.

**Inputs:** Article list, user interactions (scroll, keyboard), settings.  
**Outputs:** Reader UI updates, read/unread transitions, navigation.

**Key Responsibilities:**
- Auto mark-as-read when the article is **≥60% visible for 1.5s** (configurable). Provide “Mark Unread” undo.
- Keyboard: `j/k` next/prev, `u` unread toggle, `o` open original, `g` goto feed list, `/` search.
- Animations (Framer Motion): feed list item enter/exit, article expansion, subtle page transitions.
- Persist scroll/restoration positions per feed.

---

## Agent 6 — Feed Management Agent
**Purpose:** Manage the lifecycle of feeds, folders, sort orders, and OPML.

**Inputs:** User feed URLs, OPML uploads, edits.  
**Outputs:** Updated feed catalog, OPML exports, validation errors.

**Key Responsibilities:**
- Add/edit/remove feeds; validate URL and attempt discovery of `rel="alternate"` feed links when a webpage URL is pasted.
- Optional folders/tags. Sort by name/unread count/last updated.
- OPML import (file input) + export (download). Deduplicate feeds by URL (normalize tracking params).

---

## Agent 7 — Accessibility & Internationalization Agent
**Purpose:** Ensure the app is usable by keyboard and assistive tech, and ready for i18n.

**Key Responsibilities:**
- Proper roles/landmarks, focus outlines, skip-to-content, aria-live for updates.
- Alt text rendering under images; respect user “reduced motion” preference.
- Externalize copy into a message catalog (en.json) for future translations.

---

## Agent 8 — Offline & Performance Agent
**Purpose:** Make it work offline and feel snappy.

**Key Responsibilities:**
- Service Worker (Workbox) to cache app shell + recently read articles and images.
- Pre-cache fonts and core assets.
- Performance budgets (LCP < 2.5s on 3G; JS < 150KB gzip initial).

---

## Agent 9 — Build & Deployment Agent
**Purpose:** Ship to GitHub Pages reliably.

**Key Responsibilities:**
- Vite build with `base` set to repo subpath.
- GitHub Actions workflow: on push to `main`, build and deploy to `gh-pages` branch.
- Cache node_modules to speed builds.

---

## Architecture Snapshot
- **React + Vite + TypeScript** SPA.
- **Dexie** for persistent local storage.
- **Framer Motion** for subtle motion.
- **Readability + heuristics** for full content / main image extraction (best-effort with CORS).
- **Service Worker** for offline reads.
- **No server** required; optional micro-proxy is documented but not mandated.
