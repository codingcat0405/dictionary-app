# UI Inventory Report: Dictionary App (Electron + React)

## 1. Tech Stack

| Item | Value |
|---|---|
| UI library | **antd (Ant Design) v5.24.6** — heavily used everywhere (Table, Form, Modal, Card, Select, etc.) |
| CSS framework | **Tailwind CSS v4.1.3** via `@tailwindcss/vite` plugin — CSS-first config (no `tailwind.config.*` file exists; `main.css` is just `@import "tailwindcss";` with zero customization/tokens) |
| PostCSS config | None found — not needed with the Tailwind v4 Vite plugin |
| shadcn/ui | **Not set up.** No `components.json`, no `src/components/ui/*` directory. Migration would start from scratch. |
| Routing | `react-router-dom` v7.5.0, using `HashRouter` (Electron-friendly). Single flat route table in `AppLayout.tsx` (no nested/layout routes, no route-based code splitting). |
| State management | `jotai` v2.12.4 is a dependency and one atom is defined (`src/renderer/src/states/atoms.ts` → `isAdminAtom`), **but it is never imported/used anywhere else in the app.** All actual "auth"/user state is read ad-hoc from `localStorage` (`ACCESS_TOKEN_KEY`) and parsed inline in components (Header, AdminPage, LoginPage, RegisterPage). No central auth context. |
| Data fetching | `@tanstack/react-query` v5.81.5 — used in admin dashboard/tabs and a couple of modals, but **not** in most user-facing pages (Dictionary, Exercise, Curriculum pages use manual `useState`/`useEffect` + try/catch instead of `useQuery`). Inconsistent pattern across the codebase. |
| Rich text | `react-quill` (Quill v1-style) for dictionary definition editing in admin. |
| Toasts | `react-hot-toast`, plus antd's own `message`/`Modal` — **two different toast/notification systems used interchangeably** (e.g. `ExercisePage.tsx` uses antd `message`, most others use `react-hot-toast`). |
| Icons | Mixed: `@ant-design/icons` and `react-icons` (`react-icons/io`, `/ci`, `/md`, `/io5`, `/bi`, `/hi2`, `/fa`) used side by side. |
| Other | `country-flag-icons` (dictionary language flags), `bad-words` (profanity filter), `moment` for dates. |

No global design tokens, no dark mode, no `ConfigProvider`/antd theme customization anywhere (`main.tsx` only wraps in `HashRouter`; no antd `ConfigProvider`).

## 2. Page Inventory (`src/renderer/src/pages/`)

### User/Student panel
| File | Lines | Description |
|---|---|---|
| `pages/DictionaryPage.tsx` | 278 | Home page (`/`). Basic EN↔VN dictionary lookup: search input with autocomplete dropdown, dictionary switch (flag icons), recent/saved word chips, entry display via `DictionaryEntry`. |
| `pages/AdvanceDictionaryPage.tsx` | 433 | Specialized/technical dictionary lookup (`/advanced-dictionary`), similar layout to DictionaryPage but separate implementation (duplicated logic, not shared) with a `Card`-based result view, image gallery, and speak/favorite buttons. |
| `pages/ExercisePage.tsx` | 415 | Student exercise/quiz page (`/exercise`): two-column layout — exercise list on left (with completed/score badges) and quiz taking UI on right (radio-button MCQs, audio playback, submit/reset, circular score progress). |
| `pages/CurriculumPage.tsx` | 170 | Student-facing curriculum/document library (`/curriculum`): searchable card grid of downloadable files (PDF/DOC/TXT) with icons, size/type tags, empty state. |
| `pages/LoginPage.tsx` | 59 | Login form (`/login`). |
| `pages/RegisterPage.tsx` | 71 | Registration form (`/register`), auto-logs in after signup. |

### Admin panel
| File | Lines | Description |
|---|---|---|
| `pages/admin/AdminPage.tsx` | 78 | Admin shell (`/admin`): horizontal `Menu` tab bar (Tổng quan/Từ điển/Bài tập/Giáo trình) inside an antd `Layout`; renders one of 4 tab components based on local `activeTab` state (no sub-routing — tab state is lost on refresh). |
| `pages/admin/tabs/DashBoard.tsx` | 120 | Admin overview tab: 4 stat cards (partly hardcoded numbers, e.g. "387,517 từ" is a literal string, not live data) + two small tables (recent exercises, recent words). |
| `pages/admin/tabs/Dictionary.tsx` | 262 | Admin CRUD for dictionary words: paginated `Table` + create/edit `Modal` with Quill rich-text editor and `ImageUpload`. |
| `pages/admin/tabs/Execices.tsx` | 167 | Admin CRUD for exercises: `Table` with 4 icon-only action buttons per row (edit/delete/view/view-submissions), opens 3 different modals. |
| `pages/admin/tabs/Curriculum.tsx` | 255 | Admin CRUD for curriculum files: `Table` with file-type tags, download/edit/delete actions (delete has `Popconfirm`, others don't), upload modal. |

**Largest/most complex pages** (>200 lines, need most UI/UX attention): `ExercisePage.tsx` (415), `AdvanceDictionaryPage.tsx` (433), `Curriculum.tsx` admin tab (255), `Dictionary.tsx` admin tab (262), `DictionaryPage.tsx` (278).

## 3. Component Inventory (`src/renderer/src/components/`)

| File | Lines | Description |
|---|---|---|
| `CreateExerciceModal.tsx` | 291 | Modal form to create/edit an exercise with dynamic list of MCQ questions (4 options + correct-answer radio + optional audio upload per question). |
| `CurriculumUpload.tsx` | 211 | Reusable form (used inside admin Curriculum modal) for picking a document file via Electron dialog, showing metadata, title/description fields. |
| `AudioUpload.tsx` | 164 | File-picker + inline audio player/upload widget used by exercise question forms. |
| `DictionaryEntry.tsx` | 136 | Renders a full dictionary entry (word, pronunciation, speak button, favorite heart, parts of speech, definitions, examples, idioms, specialized fields, related words). Used by `DictionaryPage`. |
| `ExerciseSubmissionsModal.tsx` | 146 | Admin modal showing a table of student submissions/scores for one exercise, with average-score summary. |
| `ImageUpload.tsx` | 132 | File-picker + thumbnail grid upload widget for dictionary entry images. |
| `ServerProtectedRoute.tsx` | 88 | Route guard that checks backend server health/config (not user auth) before rendering children; shows loading/warning/error states. Confusingly named — it does **not** check login/role despite gating `/admin`. |
| `Footer.tsx` | 121 | Global footer bar: version text, server IP display, gear-icon settings modal for configuring backend IP. |
| `Header.tsx` | 91 | Global top nav bar: logo, centered title text, right-side user dropdown (menu items differ by role, built inline) or login button. |
| `ViewExerciseModal.tsx` | 92 | Read-only modal showing an exercise's questions/answers with correct-answer highlighting. |
| `DebugPanel.tsx` | 111 | Hidden dev-only overlay (Ctrl+Shift+D) showing dictionary index status. Not part of the real UX surface but ships in the bundle. |

## 4. Routing

Single-level route table, `HashRouter`, defined in `src/renderer/src/App.tsx` → `src/renderer/src/layouts/AppLayout.tsx`:

```
/                      DictionaryPage           (public, wrapped in ServerProtectedRoute? NO - only route without it)
/login                 LoginPage                (ServerProtectedRoute)
/register              RegisterPage             (ServerProtectedRoute)
/admin                 AdminPage                (ServerProtectedRoute; role check done inside AdminPage's useEffect, not in router)
/exercise               ExercisePage             (ServerProtectedRoute)
/advanced-dictionary    AdvanceDictionaryPage    (ServerProtectedRoute)
/curriculum             CurriculumPage           (ServerProtectedRoute)
*                       redirect to /
```

Notes:
- `ServerProtectedRoute` only verifies **backend connectivity**, not authentication/authorization — despite wrapping `/admin`. Actual admin-role gating happens client-side inside `AdminPage`'s `useEffect` (redirects if `user.role !== 'admin'`), meaning a non-admin briefly sees the admin shell before redirect, and there's no protection against manually editing `localStorage`.
- Admin sub-navigation (Tổng quan/Từ điển/Bài tập/Giáo trình) is **not** URL-addressable — it's local component state (`activeTab`) inside `AdminPage`, so refreshing or bookmarking a specific admin tab is impossible, and there's no deep-linking.
- No route-level code splitting/lazy loading — all pages bundle together.

## 5. Layout/Shell Components

- Single shared shell for **both** admin and user panels: `layouts/AppLayout.tsx` renders `Header` + `<Routes>` + `Footer` for every page, including the admin panel. There is no distinct `AdminLayout`/`AdminSidebar` — the admin panel is just `AdminPage.tsx` rendering its own internal `Layout` (antd) with a horizontal tab `Menu` (styled `theme="dark"`), still sandwiched between the same global `Header`/`Footer` used by student pages.
- `Header.tsx` — shared top bar for all pages; conditionally shows different dropdown menu items for admin vs. student (`items` vs `itemsUser`), built as an inline array rather than a shared/reusable nav config.
- `Footer.tsx` — shared bottom bar for all pages (version + server IP config modal), same for both panels.
- No dedicated `Sidebar` component exists anywhere; admin navigation uses a horizontal top menu (`AdminPage.tsx`) instead.

## 6. Styling Setup

- `src/renderer/src/main.css` is the **only** CSS file in the renderer: single line, `@import "tailwindcss";` — no custom theme, no CSS variables/design tokens, no dark-mode setup.
- No `tailwind.config.*`/`postcss.config.*` files exist (Tailwind v4 + `@tailwindcss/vite` plugin auto-detects content — confirmed via `electron.vite.config.ts`, which registers `tailwindcss()` as a Vite plugin for the `renderer` build only).
- Styling is a hybrid: Tailwind utility classes mixed inline with antd component props/styles and occasional raw inline `style={{}}` objects. No CSS modules, no styled-components.
- Colors are hardcoded ad hoc Tailwind classes (`bg-blue-400`, `text-blue-600`, `bg-gray-50`, etc.) with no semantic naming.

## 7. Large/Complex Pages & UX Issues Spotted

**Confusing/inconsistent UX patterns found while reading JSX:**
1. **Unlabeled icon-only buttons** in `Execices.tsx` admin tab and `Dictionary.tsx` admin tab: edit/delete/view/submissions actions are `Button` with only an `icon` prop, no visible label, only "view submissions" has a `title` tooltip.
2. **Delete without confirmation in some places but not others**: `Curriculum.tsx` admin tab wraps delete in `Popconfirm`, but `Dictionary.tsx` and `Execices.tsx` admin tabs delete immediately on click with no confirmation dialog.
3. **No loading/empty state on several pages**: `DictionaryPage.tsx` and `AdvanceDictionaryPage.tsx` show a static placeholder but no spinner while async lookup is in flight.
4. **Mixed notification systems**: `react-hot-toast` and antd's `message`/`Modal.confirm` both used across the app.
5. **Admin role/auth check happens after render, client-side only**: `AdminPage.tsx` reads `localStorage`, parses JSON without guarding (`JSON.parse(userString)` then accesses `user.role` — throws if malformed), redirects inside `useEffect`, admin shell flashes before redirect.
6. **Admin tab navigation isn't routed** — no deep links, breadcrumbs, or browser-back support within admin panel.
7. **Duplicated "get backend URL for asset" logic** copy-pasted with slight variations across `AdvanceDictionaryPage.tsx`, `ImageUpload.tsx`, `AudioUpload.tsx`, `CurriculumUpload.tsx`, `CurriculumPage.tsx`, `Curriculum.tsx`, `ExercisePage.tsx`.
8. **Hardcoded/fake data**: `DashBoard.tsx` admin tab shows literal strings for dictionary stat cards instead of live counts.
9. **Dead state layer**: `jotai`'s `isAdminAtom` is defined but completely unused — auth/role state re-derived from `localStorage` independently in 4 places.
10. **`dangerouslySetInnerHTML`** used to render Quill-authored HTML definitions — functional but bypasses component styling consistency.

## Unresolved Questions (from scouting)
- Confirm whether `jotai`/`isAdminAtom` was intended for a future auth-context refactor that never landed, or is dead code safe to remove.
- Scope of modernization — RESOLVED by user: hybrid antd+shadcn, foundation→user→admin phasing, clean modern SaaS look, fix bugs as part of this pass. See `ui-ux-designer-260728-1103-design-system-brief.md` for the resulting design system.
