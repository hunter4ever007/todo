# PROJECT_MAP — Todo PWA

## [TECH_STACK]

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Runtime | Vanilla JS (ES Modules) | — | Zero framework overhead; todo CRUD is trivial |
| Build | Vite | 8.1.3 | Fastest bundler, native ESM, zero-config HMR |
| PWA | vite-plugin-pwa | 1.3.0 | Wraps Workbox 7.4.1, generates SW + manifest |
| Storage | localStorage | — | Synchronous, sufficient for <10K tasks, zero deps |
| Logging | Custom (async `console.*` queue) | — | Non-blocking, no library weight |
| Styles | Plain CSS | — | No preprocessor needed at this scale |

**Deprecation check**: All packages above are the latest stable as of 2026-07-07. No deprecated APIs used.

---

## [SYSTEM_FLOW]

```
User ──> index.html
           │
           └──> src/main.js  (bootstrap, register SW)
                   │
                   ├──> src/store.js   (localStorage CRUD)
                   ├──> src/ui.js      (render list, form, controls)
                   └──> src/logger.js  (async INFO/WARN/ERROR)
```

**User Journey (verifiable goals):**
1. Open app → empty state rendered (`ui.js: renderEmpty`)
2. Type "Buy milk" + Enter → task persisted (`store.js: addTask`) → list updated (`ui.js: renderList`)
3. Click ☐ → task toggled complete (`store.js: toggleTask`) → strikethrough applied
4. Click 🗑 → task deleted (`store.js: deleteTask`) → list re-rendered
5. Refresh → all tasks survive (`store.js: loadTasks` from localStorage)
6. Toggle airplane mode → app still works, same CRUD
7. Click "Install" prompt → app installs as standalone window

**No feature creep:** No categories, no due dates, no tags, no drag-drop, no backend. Strict CRUD + PWA only.

---

## [ARCHITECTURE]

```
todo/
├── index.html              # SPA shell, meta tags, SW registration script
├── vite.config.js          # Vite config + vite-plugin-pwa setup
├── package.json            # Dependencies: vite, vite-plugin-pwa
│
├── public/
│   └── icons/
│       ├── icon-192.svg
│       └── icon-512.svg
│
├── src/
│   ├── main.js             # Entry: init store, bind events, render
│   ├── store.js            # Data layer: load/save/toggle/delete via localStorage
│   ├── ui.js               # DOM: render list, form, empty state, error state
│   ├── logger.js           # Async logger: buffered INFO/WARN/ERROR to console
│   └── style.css           # All styles (dark/light via prefers-color-scheme)
│
└── PROJECT_MAP.md
```

**Design rules:**
- `store.js` owns all state; `ui.js` is pure rendering; `main.js` wires them.
- No shared/core layer beyond what's actually reused (logger is the only cross-cutting concern).
- Max 4 source files + 1 HTML + 1 CSS. No micro-files.

---

## [ORPHANS & PENDING]

| Item | Status | Action |
|------|--------|--------|
| PWA icons | DONE | SVG icons in `public/icons/` |
| SW update prompt | SKIPPED | Auto-update (`registerType: 'autoUpdate'`) is better UX |
| Offline analytics | SKIPPED | Out of scope |
| Push notifications | SKIPPED | Out of scope |
| E2E test | PENDING | Add if needed post-MVP |

---

## [LOGGING STRATEGY]

- **Levels:** `INFO`, `WARN`, `ERROR` only
- **Mechanism:** `logger.js` queues log entries during high-frequency ops (render) and flushes asynchronously via `requestIdleCallback` / fallback `setTimeout`
- **No performance impact:** synchronous ops delegate to a microtask; never block the main thread
- **No external deps:** plain `console` under the hood, no Sentry/LogRocket in MVP

---

## [MILESTONES]

| # | Milestone | Verifiable Goal |
|---|-----------|-----------------|
| M1 | Scaffold + deps | ✅ `npm run build` produces working `dist/` |
| M2 | Data layer | ✅ `store.js` CRUD with error handling + logging |
| M3 | UI rendering | ✅ Form, list, toggle, delete, empty state |
| M4 | PWA integration | ✅ SW + manifest generated; `dist/sw.js` active |
| M5 | Polish | ✅ Dark mode, empty state, error boundaries, async logger |
| M6 | Ship | ✅ `npm run build` produces deployable `dist/` |

---

**Status:** All milestones complete. `PROJECT_MAP.md` is the single source of truth.
