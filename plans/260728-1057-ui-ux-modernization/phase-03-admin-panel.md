# Phase 03 — Admin Panel

## Context Links

- [Design system brief](../reports/ui-ux-designer-260728-1103-design-system-brief.md) §6 (AdminLayout), §4 (component list), §7 (states)
- [UI inventory](../reports/explore-260728-1057-ui-inventory.md) §2 admin, §4 routing, §7 bugs 1/2/5/6/8
- [Phase 01](./phase-01-foundation.md) — blocker; [Phase 02](./phase-02-user-panel.md) — supplies state components
- [Plan overview](./plan.md)

## Overview

- **Priority:** P2
- **Status:** pending (blocked by Phase 01; consumes Phase 02's state components)
- **Effort:** ~8h
- Replace the state-only admin tab shell with a routed `AdminLayout` (shadcn sidebar), move the role guard to the route level, restyle the 4 CRUD tabs, standardize destructive confirms and icon-button tooltips, and replace the dashboard's fake stat numbers with real data.

## Key Insights

- **The fake dashboard stats have a real local source.** `DashBoard.tsx:86,91` hardcode `"387,517 từ"` / `"42,252 từ"`. `window.api.getDictionaryStatus()` (preload → `ipcMain.handle('get_dictionary_status')`, already used by `DebugPanel.tsx`) returns `{ ev: { wordCount, initialized }, ve: { wordCount, initialized } }`. **No backend endpoint needed, no card dropped.** Other two cards already use live `total`s from `getAllExercises`/`getDictionary`.
- Role-guard flash: `AdminPage.tsx:34-43` redirects inside `useEffect`, so the admin shell paints first. Additionally `JSON.parse(userString)` then `user.role` throws when the value is `'{}'` (i.e. logged out) — a logged-out user hitting `/admin` currently gets a crash, not a redirect. Route-level guard using Phase 01's `useAuth()` fixes both.
- Delete confirmations are inconsistent: only `admin/tabs/Curriculum.tsx:187` has a `Popconfirm`; `Dictionary.tsx` and `Execices.tsx` delete on click. Standardize all three on shadcn `alert-dialog`, and drop the lone `Popconfirm` so there is exactly one destructive-confirm pattern.
- `Execices.tsx` has 4 icon-only buttons; only the last has a `title`. Mapping (verified from the JSX handlers): `CiEdit` → Sửa bài tập; `MdDeleteOutline` → Xóa bài tập; `IoEyeOutline` → Xem bài tập (`ViewExerciseModal`); `BiUserCheck` → Xem kết quả học viên (`ExerciseSubmissionsModal`). Keep the existing react-icons or swap to lucide — either is fine, but every one gets a `tooltip`.
- `AdminPage.tsx` currently nests an antd `Layout`+dark `Menu` **inside** the global Header/Footer. New shape: `AdminLayout` renders sidebar + `<Outlet/>`; the global `Footer` must remain reachable (it owns the LAN IP config) per §6.
- Header's "Quản trị" link points at `/admin` — the index redirect to `/admin/dashboard` keeps it working untouched.

## Requirements

**Functional**
- `/admin` → redirect `/admin/dashboard`; four addressable routes; refresh and browser-back preserve the active section.
- Non-admin (or logged-out) visiting any `/admin/*` route is redirected to `/` with **no admin UI painted**.
- Sidebar per §6: 240px / 64px collapsed, logo header row, 4 Vietnamese nav items with solid-fill active state, user identity + logout at the bottom, collapse toggle.
- Every destructive action (dictionary word, exercise, curriculum file) confirms via shadcn `alert-dialog` with the item's name in the message.
- Every icon-only action button has a tooltip.
- Dashboard shows 4 live stat cards; empty admin tables use the shared `EmptyState` via `Table.locale.emptyText`.

**Non-functional**
- antd `Table`/`Form`/`Modal`/Quill retained and themed — no rewrite of CRUD forms.
- No route-level code splitting added (YAGNI for a bundled desktop app).
- `bun run typecheck` clean; Vietnamese labels byte-identical to the current tab labels.

## Architecture

```
AppLayout.tsx
  <Header/>                      (student chrome; still rendered for admin? NO — see below)
  <Routes>
    /                  DictionaryPage
    /login /register /exercise /advanced-dictionary /curriculum   (ServerProtectedRoute)
    /admin  → <ServerProtectedRoute><RequireAdmin><AdminLayout/></RequireAdmin></ServerProtectedRoute>
        index        → <Navigate to="dashboard" replace/>
        dashboard    → <DashBoard/>
        dictionary   → <Dictionary/>
        exercises    → <Execices/>
        curriculum   → <Curriculum/>
    *                  → <Navigate to="/"/>
  <Footer/>                      (stays global — owns LAN IP config, §6)
```

`RequireAdmin` (new, `components/require-admin.tsx`): reads `useAuth()` **synchronously during render**; if `!isAdmin` returns `<Navigate to="/" replace/>` — never renders children, so no flash. Guard order matters: `ServerProtectedRoute` outermost (connectivity), `RequireAdmin` inside it.

Header on admin routes: keep it rendered (simplest — `AppLayout` wraps everything and the sidebar supplies its own user block per §6). If the duplicated user menu looks redundant in the smoke test, hide the Header's dropdown on `/admin/*` via the existing `useLocation()` check rather than restructuring layouts.

Dashboard data flow:
```
useQuery(['dictionary-status']) → window.api.getDictionaryStatus()
  → card "Từ điển anh - việt"  = ev.wordCount   (format với toLocaleString('vi-VN') + " từ")
  → card "Từ điển việt - anh"  = ve.wordCount
useQuery(['exercises'])  → total  → card "Bài tập đã tạo"       (already live)
useQuery(['dictionary']) → total  → card "Từ chuyên ngành"      (already live)
```
If `initialized === false`, show the card's skeleton/`—` rather than `0` (a real 0 and "index not loaded yet" must not look the same).

## Related Code Files

**Create**
- `src/renderer/src/layouts/AdminLayout.tsx`
- `src/renderer/src/components/admin/admin-sidebar.tsx` (nav config + shadcn `sidebar`)
- `src/renderer/src/components/require-admin.tsx`
- `src/renderer/src/components/confirm-delete-dialog.tsx` (shadcn `alert-dialog` wrapper: item name in, `onConfirm` out)

**Modify**
- `src/renderer/src/layouts/AppLayout.tsx` (nested `/admin/*` routes) — **Phase 03 owns this file**
- `src/renderer/src/pages/admin/tabs/DashBoard.tsx` (real stats + restyle)
- `src/renderer/src/pages/admin/tabs/Dictionary.tsx` (tooltips, confirm dialog, restyle)
- `src/renderer/src/pages/admin/tabs/Execices.tsx` (4 tooltips, confirm dialog, restyle)
- `src/renderer/src/pages/admin/tabs/Curriculum.tsx` (replace `Popconfirm`, tooltips, restyle)
- `src/renderer/src/components/CreateExerciceModal.tsx` (restyle; antd Form + dynamic question list logic unchanged; its `AudioUpload` usage untouched)
- `src/renderer/src/components/Header.tsx` (optional: hide dropdown on `/admin/*`)

**Delete**
- `src/renderer/src/pages/admin/AdminPage.tsx` (superseded by `AdminLayout` + routes)

## Implementation Steps

1. **Guard.** Create `require-admin.tsx` using Phase 01's `useAuth()`. Render-time decision only, no `useEffect`.
2. **Sidebar.** Build `admin-sidebar.tsx`: nav array `[{to:'dashboard', label:'Tổng quan', icon:LayoutDashboard}, {to:'dictionary', label:'Từ điển', icon:BookOpen}, {to:'exercises', label:'Bài tập', icon:ClipboardList}, {to:'curriculum', label:'Giáo trình', icon:GraduationCap}]` rendered with `NavLink` for the active state (solid `bg-primary-500 text-white` fill per §6). Logo row on top, user block (`avatar` + name + role `badge` + logout) and collapse toggle at the bottom. Labels must match the old tab labels exactly.
3. **Layout.** `AdminLayout.tsx` = sidebar + content area (`bg-background`, `p-6`, white panel `rounded-lg shadow-sm`) wrapping `<Outlet/>`.
4. **Routes.** Rewrite the `/admin` entry in `AppLayout.tsx` as a nested route block per Architecture; import the 4 tab components directly. Delete `AdminPage.tsx`.
5. **Confirm dialog.** Build `confirm-delete-dialog.tsx` (title/description take the item name, destructive-styled confirm button, Vietnamese: `Xóa` / `Hủy`). Wire into all three delete paths; remove the antd `Popconfirm` import from `Curriculum.tsx`.
6. **Tooltips.** Wrap every icon-only action button in the three tabs with shadcn `tooltip`, using the label mapping in Key Insights (and equivalents in `Dictionary.tsx`/`Curriculum.tsx`).
7. **Dashboard.** Add the `getDictionaryStatus` query; replace both hardcoded strings; format counts with `toLocaleString('vi-VN')`; handle `initialized === false`; restyle the 4 cards as shadcn `card` (icon + label + big number) and the two tables with the themed antd `Table` + `EmptyState` locale.
8. **Tabs restyle.** For each of Dictionary / Execices / Curriculum: page title in `text-h1`, table toolbar (title + primary action) above a themed antd `Table`, file-type/status pills as shadcn `badge`, `locale.emptyText={<EmptyState .../>}`, skeleton on first load. antd `Modal` + Quill form bodies keep their structure — spacing/typography polish only.
9. **CreateExerciceModal.** Restyle question cards / add-remove controls with tokens; leave the form state machine and `AudioUpload` integration alone.
10. **Verify.** `bun run typecheck`, `bun run lint`, smoke checklist.

## Todo List

- [ ] 1. `RequireAdmin` render-time guard
- [ ] 2. `admin-sidebar.tsx` (4 VI nav items, user block, collapse)
- [ ] 3. `AdminLayout.tsx` with `<Outlet/>`
- [ ] 4. Nested `/admin/*` routes in `AppLayout.tsx`; delete `AdminPage.tsx`
- [ ] 5. `confirm-delete-dialog.tsx`; wire 3 delete paths; drop `Popconfirm`
- [ ] 6. Tooltips on all icon-only admin buttons
- [ ] 7. DashBoard real stats via `getDictionaryStatus` + card restyle
- [ ] 8. Restyle Dictionary / Execices / Curriculum tabs
- [ ] 9. Restyle `CreateExerciceModal`
- [ ] 10. typecheck + lint + smoke

## Success Criteria

- `bun run typecheck` + `bun run lint` pass; `grep -rn "AdminPage" src/` → 0 hits.
- Navigating to `#/admin` lands on `#/admin/dashboard`; each of the 4 URLs survives a full app reload on the correct section; browser-back moves between sections.
- Logged out → `#/admin/dictionary` redirects to `/` with **no** admin chrome visible for any frame (verify by throttling / recording, or by asserting the guard returns `<Navigate/>` before any admin render) and **no** console exception.
- Non-admin student account → same redirect.
- Dashboard shows real EN→VN and VN→EN word counts matching `DebugPanel` (Ctrl+Shift+D) values; no literal `387,517` / `42,252` remain (`grep -rn "387,517\|42,252" src/` → 0).
- Deleting a word, an exercise, and a curriculum file each opens the same confirm dialog naming the item; cancel aborts; confirm deletes and toasts via sonner.
- Every admin icon button shows a Vietnamese tooltip on hover.
- Empty admin table (filter to no results) shows the shared `EmptyState`, not antd's default "No data".
- Sidebar labels read exactly `Tổng quan` / `Từ điển` / `Bài tập` / `Giáo trình`; footer IP config still reachable from admin routes.
- CRUD regression: create + edit + delete one dictionary word (with image and Quill definition), one exercise (with audio question), one curriculum file.

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Route restructure breaks an existing entry point (Header "Quản trị", bookmarks) | Med × Med | `/admin` index redirect; Header link untouched; smoke both paths |
| Guard placed outside `ServerProtectedRoute` → admin redirect fires before connectivity check, confusing error | Low × Med | Fixed order: `ServerProtectedRoute` → `RequireAdmin` → `AdminLayout` |
| shadcn `sidebar` primitive assumes its own provider/CSS vars; conflicts with antd `Layout` remnants | Med × Med | Drop antd `Layout`/`Menu` from admin entirely; sidebar is pure shadcn |
| shadcn `alert-dialog` (Radix portal, z-50) rendered while an antd `Modal` (z~1000) is open | Med × High | Delete actions live in the table row, never inside an open antd Modal — enforce; if ever needed, raise the overlay z-index |
| `getDictionaryStatus` unavailable/slow at first paint (`window.api?.`) | Med × Low | Optional-chain the call (as `DebugPanel` does), skeleton the card, `—` when `initialized === false` |
| CreateExerciceModal restyle breaks the dynamic question form | Low × High | Presentational edits only; full create+edit smoke in success criteria |

## Security Considerations

- The route guard is a **UX fix, not an authorization boundary** — `localStorage` is user-editable. Every admin API call must remain authenticated server-side; do not remove or weaken any backend check on the assumption the client now guards better.
- `RequireAdmin` must fail closed: missing/malformed/expired auth → redirect, never render.
- Delete confirmations must show the item name so a mis-click on the wrong row is catchable before it destroys data.

## Next Steps

- Follow-up candidates (out of scope): route-level code splitting, server-side role verification on app start (`/users/me`), breadcrumbs, bulk actions in admin tables.
- After 02 + 03 land: run `docs-manager` to refresh `docs/` (system-architecture, code-standards) with the new token/component conventions.
