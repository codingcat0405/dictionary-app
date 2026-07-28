---
title: "UI/UX Modernization — Design System, User Panel, Admin Panel"
description: "Hybrid antd+shadcn modernization of the EV Dictionary desktop app: design tokens, self-hosted font, routed admin sidebar, and 10 UX bug fixes."
status: pending
priority: P2
effort: 26h
branch: master
tags: [ui, ux, design-system, shadcn, antd, refactor]
created: 2026-07-28
---

# UI/UX Modernization

Full visual + structural modernization of `src/renderer/src`. Hybrid strategy: **keep antd** for complex admin CRUD (Table/Form/Modal/Quill), **theme it** via `ConfigProvider`, **add shadcn/ui** primitives for chrome + all new components. All UI copy stays Vietnamese. Dark mode + mobile breakpoints out of scope.

## Context Links

- Inventory: [`plans/reports/explore-260728-1057-ui-inventory.md`](../reports/explore-260728-1057-ui-inventory.md)
- Design system: [`plans/reports/ui-ux-designer-260728-1103-design-system-brief.md`](../reports/ui-ux-designer-260728-1103-design-system-brief.md)

## Phases

| # | Phase | Effort | Status | Blocks |
|---|---|---|---|---|
| 01 | [Foundation](./phase-01-foundation.md) — tokens, font, shadcn, ConfigProvider, shared infra (auth hook, asset-URL helper, sonner) | 10h | completed | 02, 03 |
| 02 | [User panel](./phase-02-user-panel.md) — 6 pages + 6 shared components restyle, empty/loading/error states | 8h | pending | — |
| 03 | [Admin panel](./phase-03-admin-panel.md) — routed AdminLayout + sidebar, role guard, 4 CRUD tabs, real dashboard stats | 8h | pending | — |

Order is **strictly 01 → (02 ‖ 03)**. 02 and 03 touch disjoint files and may run in parallel after 01 lands, but 03 changes `AppLayout.tsx` routing (also touched by nothing in 02) — see file ownership in each phase.

## Key Decisions (locked, do not re-litigate)

1. **Auth state → plain hook, no jotai.** Delete dead `states/atoms.ts` + drop `jotai` dep. New `hooks/use-auth.ts` (safe JSON parse + `useSyncExternalStore` over an `auth-changed` event) replaces 4 duplicated `localStorage` parses. Rationale: fewer moving parts than a jotai store, and the route guard needs a *synchronous* read to avoid the admin-flash bug.
2. **Toasts → `sonner` only.** Remove `react-hot-toast` dep; migrate all antd `message.*` sites too. antd `Modal.confirm`/`Popconfirm` → shadcn `alert-dialog`.
3. **Asset URLs → one helper** `lib/backend-url.ts` replacing 7 copy-pasted blocks. Also deletes the stale `API_URL` const (evaluated once at import; unused elsewhere — trap).
4. **Dashboard fake stats → real data** from `window.api.getDictionaryStatus()` (returns `ev.wordCount` / `ve.wordCount`). No backend change needed, no card dropped.
5. **Path alias:** add `@/*` → `src/renderer/src/*` (shadcn CLI requires it). `@/` used only for `components/ui/*` + `lib/*`; existing `@renderer/*` stays everywhere else.
6. **Upload flow logic is frozen.** `ImageUpload`/`AudioUpload`/`CurriculumUpload`/`axios-client.ts`/`dictionary-api.ts` upload fns + IPC: visual restyle only. A `uploadClient.defaults.baseURL` bug was fixed recently — must not regress.

## Verification (no test suite exists — confirmed: zero `*.test.*`/`*.spec.*` files)

Every phase ends with: `bun run typecheck` (clean) + `bun run lint` + manual smoke via `bun dev` against a running backend. Per-phase smoke checklists are in the phase files.

## Top Risks

| Risk | Phase | Mitigation |
|---|---|---|
| antd v5 runtime CSS beats Tailwind utilities (layer ordering) | 01 | 30-min spike before rollout; rule: color/radius via ConfigProvider tokens only, Tailwind on wrappers |
| Be Vietnam Pro woff2 must be fetched on an online dev machine (lab clients offline) | 01 | Download + commit font files in step 1; never a CDN `@import` |
| Regression in upload/IPC flow | 02/03 | Restyle-only rule; diff review must show no logic lines changed in upload files |
| Admin route restructure breaks deep links / Header "Quản trị" link | 03 | `/admin` index redirect to `/admin/dashboard`; Header link untouched |
