# Design System Brief — Dictionary App Foundation

Date: 2026-07-28. Scope: foundation tokens + shadcn setup plan + toast standard + AdminLayout shape + state patterns. Implementation code NOT included — for `planner` to phase.

Ground truth checked in repo: antd v5.24.6, Tailwind v4.1.3 (`@tailwindcss/vite`, CSS-first, `main.css` = `@import "tailwindcss";` only), no ConfigProvider theme anywhere, no dark mode, react-hot-toast v2.5.2 + antd `message` both in use, no `components.json`/shadcn, current "brand" color is untouched Tailwind `blue-400`/`blue-600` (Header/Footer bg, links) = accidental, not a deliberate token.

---

## 1. Color Palette

**Decision: keep blue family for continuity (users/teachers already associate blue w/ this app) but move to a deliberate, deeper, more "SaaS" blue instead of raw Tailwind `blue-500`.** Raw `blue-500` reads as default/bootstrap-y: pull it toward slightly desaturated indigo-blue for a premium feel while staying instantly recognizable as "the same app."

**Base neutral: `slate`** (cooler, pairs better with blue than zinc).

### Primitives (OKLCH, Tailwind v4 native format)

```css
--color-neutral-50:  oklch(0.984 0.003 247.86);
--color-neutral-100: oklch(0.968 0.007 247.90);
--color-neutral-200: oklch(0.929 0.013 255.51);
--color-neutral-300: oklch(0.869 0.022 252.89);
--color-neutral-400: oklch(0.704 0.040 256.79);
--color-neutral-500: oklch(0.554 0.046 257.42);
--color-neutral-600: oklch(0.446 0.043 257.28);
--color-neutral-700: oklch(0.372 0.044 257.29);
--color-neutral-800: oklch(0.279 0.041 260.03);
--color-neutral-900: oklch(0.208 0.042 265.75);
--color-neutral-950: oklch(0.129 0.042 264.70);

--color-primary-50:  oklch(0.970 0.014 254.60);
--color-primary-100: oklch(0.932 0.032 255.59);
--color-primary-200: oklch(0.882 0.059 254.13);
--color-primary-300: oklch(0.809 0.100 251.81);
--color-primary-400: oklch(0.707 0.143 254.62);
--color-primary-500: oklch(0.596 0.161 255.53);  /* MAIN accent, ~#3766E8 */
--color-primary-600: oklch(0.522 0.166 255.94);  /* hover/active, ~#2451D6 */
--color-primary-700: oklch(0.454 0.156 255.99);
--color-primary-800: oklch(0.384 0.129 256.00);
--color-primary-900: oklch(0.309 0.099 255.95);
```
`primary-500 ≈ #3B6BEF`, `primary-600 ≈ #2954D6` — sanity hex fallback for anyone hand-writing antd JS tokens.

### Semantic

```css
--color-success:      oklch(0.648 0.150 152.6);  /* ~#16A34A green-600 */
--color-success-bg:   oklch(0.962 0.030 152.6);
--color-warning:      oklch(0.769 0.165 70.1);   /* ~#D97706 amber-600 */
--color-warning-bg:   oklch(0.968 0.045 90.0);
--color-error:        oklch(0.577 0.190 27.3);   /* ~#DC2626 red-600 */
--color-error-bg:     oklch(0.960 0.030 22.0);
--color-info:         var(--color-primary-500);
--color-info-bg:      var(--color-primary-50);
```

### Tailwind CSS variables (v4 `@theme` block, add to `main.css`)
```css
@import "tailwindcss";

@theme {
  --color-background: var(--color-neutral-50);
  --color-foreground: var(--color-neutral-900);
  --color-card: oklch(1 0 0);
  --color-card-foreground: var(--color-neutral-900);
  --color-border: var(--color-neutral-200);
  --color-input: var(--color-neutral-200);
  --color-ring: var(--color-primary-500);
  --color-muted: var(--color-neutral-100);
  --color-muted-foreground: var(--color-neutral-500);
  --color-accent: var(--color-primary-500);
  --color-accent-foreground: oklch(1 0 0);
  --color-destructive: var(--color-error);
  /* + all primitives above */
}
```
This gives shadcn (which reads `--background`, `--primary`, etc. by convention) a matching set — see §4 for exact shadcn var names (shadcn uses `--primary` not `--color-primary`; map both, or run `shadcn init` and then override its generated values with the hexes/oklch above rather than inventing parallel names).

### antd `ConfigProvider` theme.token
```ts
{
  token: {
    colorPrimary: '#3B6BEF',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorInfo: '#3B6BEF',
    colorTextBase: '#0F172A',      // neutral-900
    colorBgBase: '#FFFFFF',
    colorBorder: '#E2E8F0',        // neutral-200
    borderRadius: 8,
    fontFamily: '"Be Vietnam Pro", -apple-system, sans-serif',
    controlHeight: 36,
  },
  components: {
    Button: { borderRadius: 8, controlHeight: 36 },
    Input: { borderRadius: 8, controlHeight: 36 },
    Table: { borderRadius: 8, headerBg: '#F8FAFC' },
    Modal: { borderRadiusLG: 12 },
    Card: { borderRadiusLG: 12 },
  }
}
```
Wrap once at `main.tsx` root: `<ConfigProvider theme={...}><HashRouter>...`. This is the single highest-leverage change — currently zero theming exists so every antd component renders stock `#1677ff` blue, one shade off from the Header/Footer's `blue-400`, which is exactly why it looks "demo-ish."

**Why not a non-blue accent (teal/violet, trendy in 2026 SaaS):** app already has blue muscle memory across 5+ pages via Tailwind utility classes; changing hue would touch every file for zero UX gain. Deepening/desaturating the existing blue gets the "premium" upgrade at near-zero migration cost.

---

## 2. Typography

**Font: Be Vietnam Pro.** Rationale: purpose-built by a Vietnamese designer for VN diacritics (all tone marks tested, no glyph substitution artifacts unlike generic Inter/Roboto where some tone-mark combos clip), has a full weight range (300–800), geometric/humanist look fits "clean modern SaaS," and is OFL-licensed so it's safe to self-host.

**Self-host requirement (NO INTERNET on lab clients):** download `.woff2` static files (Regular 400, Medium 500, SemiBold 600, Bold 700) once during build, place in `src/renderer/src/assets/fonts/`, reference via `@font-face` in `main.css`, bundle through Vite's normal asset pipeline (electron-builder packages them into the app — no runtime fetch, no CDN `<link>`). Do NOT use `@import url(fonts.googleapis.com...)` anywhere — it will silently fail offline and fall back to system font, causing visual drift between dev (online) and lab (offline).

Fallback stack (covers case font file fails to load / OS font substitution): `"Be Vietnam Pro", "Segoe UI", -apple-system, "Helvetica Neue", Arial, sans-serif` — all of these also have decent VN glyph coverage as a safety net.

### Type scale (Tailwind `@theme` additions)
| Token | Size / Line-height | Weight | Usage |
|---|---|---|---|
| `text-display` | 32px / 40px | 700 | Page hero (rare, e.g. login) |
| `text-h1` | 24px / 32px | 600 | Page title (Từ điển, Tổng quan...) |
| `text-h2` | 20px / 28px | 600 | Section/card group title |
| `text-h3` | 16px / 24px | 600 | Card title, modal title |
| `text-body` | 14px / 22px | 400 | Default body (antd default is also 14px — stays consistent) |
| `text-body-md` | 14px / 22px | 500 | Emphasized body, table header |
| `text-small` | 12px / 18px | 400 | Caption, helper text, timestamps |
| `text-tiny` | 11px / 16px | 500 | Badge/tag label, uppercase micro-label |

Weights to keep in bundle: 400, 500, 600, 700 only (skip 300/800 — unused, reduces bundle size, matters for Electron installer size).

---

## 3. Spacing / Radius / Shadow Tokens

Small fixed scale, shared naming so devs pick same token whether writing Tailwind class or antd `components.X.borderRadius`:

```css
@theme {
  --radius-sm: 6px;   /* small controls: tags, checkboxes */
  --radius-md: 8px;   /* default: buttons, inputs, table cells  -> antd token.borderRadius: 8 */
  --radius-lg: 12px;  /* cards, modals, popovers -> antd borderRadiusLG */
  --radius-xl: 16px;  /* hero/feature cards, dialogs w/ big padding */
  --radius-full: 9999px; /* avatars, pills */

  --shadow-xs: 0 1px 2px 0 oklch(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 oklch(0 0 0 / 0.07), 0 1px 2px -1px oklch(0 0 0 / 0.06);
  --shadow-md: 0 4px 8px -2px oklch(0 0 0 / 0.08), 0 2px 4px -2px oklch(0 0 0 / 0.05);
  --shadow-lg: 0 12px 20px -4px oklch(0 0 0 / 0.10), 0 4px 8px -4px oklch(0 0 0 / 0.06);
}
```
Spacing: use Tailwind's default 4px-based scale as-is (no custom override needed — YAGNI, current scale already covers card padding p-4/p-6, gaps gap-2/gap-4/gap-6 seen across pages). Only add one semantic alias: `--spacing-page: 24px` (consistent outer page padding — currently pages use ad hoc `px-8`/`p-6` inconsistently, standardize to 24px = `p-6`).

---

## 4. shadcn/ui Setup Plan (Vite + Electron + react-router, NOT Next.js)

`components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/renderer/src/main.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```
- `style: new-york` — tighter, more "product" feel (vs `default`'s rounder/spacier look) — matches "clean modern SaaS."
- `baseColor: slate` — matches neutral palette decision above; CLI will scaffold `--background`/`--primary`/etc CSS vars into `main.css`, THEN overwrite those generated values with the exact oklch values from §1 (don't hand-pick shadcn's stock slate/blue — keep single source of truth in §1).
- `tailwind.config: ""` — Tailwind v4 has no JS config file; leave empty per shadcn v4-compat CLI behavior (confirm `@/` path alias already resolves via `vite.config` + `tsconfig` — check/add `"@/*": ["./src/renderer/src/*"]` if missing, needed before first `shadcn add` run).
- `iconLibrary: lucide` — antd already ships `@ant-design/icons` for its own components (Table actions etc.) but shadcn primitives should use `lucide-react` (shadcn default, tree-shakeable, larger/consistent icon set for new UI) — accept two icon sets coexisting, don't force-unify (YAGNI, not worth churn).

### Phase 1 component list (justify against known pages)
| Component | Why |
|---|---|
| `button` | Replaces ad hoc styled buttons outside antd forms; used everywhere new |
| `card` | CurriculumPage file grid, DashBoard stat cards — currently antd Card, migrate simple display-only cards |
| `dialog` | Simple confirms/info modals (keep antd `Modal` only for complex forms w/ Quill — see AdminPage Dictionary tab) |
| `input` | Search boxes (DictionaryPage/AdvanceDictionaryPage search+autocomplete) — pairs w/ new `command`/popover later if needed, not Phase 1 |
| `badge` | Exercise correct/incorrect tags, status pills (Dictionary CRUD table currently has no visual status system) |
| `dropdown-menu` | Header.tsx role-based user menu — currently antd Dropdown, unify to shadcn for consistent shadow/radius on the one piece of chrome visible on every page |
| `sonner` | Toast standard — see §5 |
| `sidebar` | New AdminLayout — see §6, this is the component that makes the sidebar refactor tractable |
| `avatar` | Header user avatar (currently likely plain text/icon — check Header.tsx during implementation) |
| `separator` | Sidebar section dividers, card internal dividers |
| `skeleton` | Loading states — see §7, DictionaryPage/AdvanceDictionaryPage currently have none |
| `tooltip` | REQUIRED alongside icon-only buttons fix (Execices tab 4 unlabeled icon buttons bug) — every icon-only action button must get a tooltip label |
| `alert-dialog` | Standardized destructive-action confirm (delete Dictionary/Exercise/Curriculum entries) — replaces inconsistent Popconfirm usage, always-confirm rule from bug list |

Explicitly deferred (not Phase 1, YAGNI until a page needs them): `command`, `combobox`, `calendar`, `chart`, `carousel`, `breadcrumb`, `pagination` (antd Table's built-in pagination stays as-is for CRUD tables).

### Friction points: shadcn (Tailwind) vs antd global CSS reset
1. **antd injects its own CSS reset** (`antd/dist/reset.css` or v5's CSS-in-JS reset) that sets base `box-sizing`, margins on `h1-h6`, `button`, `ul/li` — conflicts with Tailwind Preflight doing the same. **Mitigation:** Tailwind v4's Preflight and antd v5's reset both run; v5 antd is CSS-in-JS (StyleProvider-based, injected at runtime with higher specificity via `:where()` low-specificity selectors intentionally) — antd v5 was specifically designed to co-exist with Tailwind using `:where()` for low specificity, so Tailwind utility classes should already win. **Verify empirically** in Phase 1 spike: render one antd Button next to one Tailwind-styled button, confirm no visual bleed, before wide rollout.
2. **z-index stacking**: antd Modal/Dropdown/Select popups use z-index ~1000-1070; shadcn Dialog/DropdownMenu (Radix-based) use React portals appended to `<body>` with their own stacking context, default z-index in the 50 range (Tailwind's `z-50`). **Mitigation:** raise shadcn overlay z-index tokens to sit above antd's range OR (preferred, simpler) keep a rule: never render a shadcn Dialog/Dropdown while an antd Modal is open on the same page (no known page in this app nests them today) — document this constraint in the plan rather than solving full stacking-context unification now (YAGNI).
3. **CSS layer ordering**: Tailwind v4 auto-wraps its own reset+utilities in `@layer` (`theme, base, components, utilities`). antd's runtime-injected styles are NOT in a `@layer`, so they get default (highest) precedence over Tailwind's layered rules when specificity ties — meaning antd component internal styles reliably beat Tailwind utility overrides on the SAME element (e.g. `<Button className="bg-primary-500">`) unless `!important` or antd's own `style`/token override is used. **Mitigation:** for antd components, theme via `ConfigProvider`/`token` (§1) not Tailwind classes; use Tailwind classes freely on the wrapping `div`/layout, and reserve `className` overrides on antd components themselves for spacing/layout utilities only (margin/flex), never color/radius (those come from ConfigProvider tokens).
4. **Font var name collision risk**: shadcn CLI, when writing CSS vars, sometimes uses `--font-sans` — confirm it doesn't clobber a differently-scoped Tailwind v4 `--font-*` var already implied by `@theme` defaults; just check the generated diff before accepting.

---

## 5. Toast/Notification Standardization

**Decision: sonner.** Reasons: it's shadcn's own default (zero extra integration work once shadcn is set up), visually matches "new-york" style (compact, rounded, subtle shadow — same as target card/button tokens), significantly lighter than antd's `message`/`notification` CSS-in-JS overhead, and consolidates the CURRENT two-system inconsistency (react-hot-toast + antd `message`) bug into exactly one.

Action for planner: 
- Remove `react-hot-toast` dependency entirely once migration done (don't leave both installed "just in case" — YAGNI/DRY).
- Migrate all `antd.message.success/error/...()` call sites → `sonner`'s `toast.success/error(...)`.
- Migrate all `antd.Modal.confirm(...)` used for INFO/success confirmation (non-destructive) → keep as antd `Modal.confirm` only if it's a blocking decision dialog; for simple "action succeeded" feedback use `sonner` toast instead — Modal.confirm should be reserved for destructive-action confirms (aligns with the "standardize to always-confirm for destructive actions" bug fix) or via shadcn `alert-dialog` (§4) instead of antd Modal.confirm, for full visual consistency with new system.
- Mount single `<Toaster position="top-right" richColors />` once at app root (`main.tsx` or `App.tsx`), remove per-page toast setup if any exists.

---

## 6. AdminLayout Shape (sidebar + real routes)

Current: `AdminPage.tsx` = single shell, horizontal antd `Menu` tabs, local state only (`activeTab`), refresh loses position, and (per bug list) briefly flashes admin UI before role-redirect completes.

**New shape:**

```
/admin                     -> redirect to /admin/dashboard
/admin/dashboard           -> Tổng quan   (DashBoard content)
/admin/dictionary          -> Từ điển     (Dictionary CRUD)
/admin/exercises           -> Bài tập     (Exercises CRUD)
/admin/curriculum          -> Giáo trình  (Curriculum CRUD)
```

Structure: `AdminLayout.tsx` (new, sibling to existing `AppLayout.tsx` in `layouts/`) wraps a react-router `<Outlet />`, rendered via nested routes:
```
<Route path="/admin" element={<ServerProtectedRoute><AdminLayout/></ServerProtectedRoute>}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<DashBoard/>} />
  <Route path="dictionary" element={<DictionaryAdmin/>} />
  <Route path="exercises" element={<ExercisesAdmin/>} />
  <Route path="curriculum" element={<CurriculumAdmin/>} />
</Route>
```
This directly fixes "tab state lost on refresh" — URL now IS the state. Role-check flash bug: guard belongs on `ServerProtectedRoute` wrapping `/admin` itself (one guard, one redirect point) rather than per-tab-content checks — but that's an implementation detail for planner, not a visual design decision.

**Visual layout** (built with shadcn `sidebar` primitive, NOT antd `Layout.Sider`):
- Fixed-width sidebar, 240px expanded / 64px collapsed (icon-only), collapsible via toggle button pinned bottom of sidebar.
- Sidebar bg: `--color-neutral-50` (subtle contrast vs white content area `--color-card`), right border `1px solid var(--color-border)`.
- Logo (`assets/logo.png`, already exists) + app name top of sidebar, 64px header row, border-bottom.
- Nav items: icon (lucide, 18px) + label, 40px row height, `--radius-md` on hover/active pill background inset 8px from sidebar edges (not full-bleed — matches "generous whitespace" SaaS pattern).
  - Default: `text-neutral-600`, no bg.
  - Hover: `bg-neutral-100`, `text-neutral-900`.
  - Active (current route via `NavLink`/`useLocation` match): `bg-primary-50` background, `text-primary-600` text+icon, left accent bar 3px `bg-primary-500` OR simply solid `bg-primary-500 text-white` fill (pick solid-fill — bolder, clearer at-a-glance for non-technical school-lab admins who are the actual users; subtlety is wasted on infrequent low-tech-literacy admin users).
- Labels (Vietnamese, matches current tab labels exactly): `Tổng quan` (dashboard icon), `Từ điển` (book icon), `Bài tập` (clipboard-list icon), `Giáo trình` (folder/graduation-cap icon).
- Bottom of sidebar: user identity (avatar+name+role badge) + logout, above/near the collapse toggle — this replaces relying solely on Header.tsx dropdown while in admin section (Header can stay for user-panel pages).
- Content area: `--color-background` (neutral-50) page bg, inner content in white `Card`/panel with `--radius-lg` + `--shadow-sm`, page padding `--spacing-page` (24px), page title uses `text-h1` token with breadcrumb-less simple title (URL segment already tells user where they are).
- Responsive note: this is a desktop Electron app (fixed window, not resized to mobile widths) — do NOT invest mobile-breakpoint sidebar collapse logic; a manual collapse toggle is sufficient (YAGNI — no phone/tablet use case exists for this internal school-lab tool).

Footer.tsx's backend LAN IP config modal: keep visible/reachable from BOTH user AppLayout and new AdminLayout — do not bury it inside admin-only sidebar; it's a cross-cutting app-level feature (per task brief, "must stay easily discoverable"), so it stays in the global `Footer.tsx` rendered outside/below the admin `<Outlet/>`, not moved into sidebar nav.

---

## 7. Empty / Loading / Error State Pattern

Standard 3-state pattern, one small set of reusable pieces (implementation detail for planner, shape described here):

- **Loading**: shadcn `skeleton` blocks shaped like the actual content they replace (e.g. DictionaryPage result panel loading = skeleton lines mimicking word/definition/example rows, not a generic spinner) — reduces layout shift, feels faster. For quick sub-300ms async actions (e.g. table row action), fine to keep antd `Spin` inline instead — don't skeleton everything (YAGNI, only apply skeleton to primary content-loading paths: DictionaryPage/AdvanceDictionaryPage search results, ExercisePage list, CurriculumPage grid, admin Dashboard stat cards/tables).
- **Empty**: consistent empty-state block — centered icon (lucide, 48px, `text-neutral-300`) + `text-body` message in Vietnamese + optional primary action button. Apply to: DictionaryPage (no search yet / no results found — these are TWO distinct empty states, word it differently: "Nhập từ để tra cứu" vs "Không tìm thấy kết quả"), CurriculumPage (no files match filter), ExercisePage (no exercises available), admin CRUD tables (antd Table's built-in `locale.emptyText` prop — pass the same styled empty component in for visual consistency rather than antd's default gray "No data").
- **Error**: inline error block (not full-page) — icon (`text-error`) + short Vietnamese message + "Thử lại" (retry) button that re-triggers last query. Given LAN-only architecture (backend on one lab PC, all others are clients), THE most common error case in this app is "server unreachable" (backend PC off/networked wrong) — this specific error state deserves a distinct, clearer message ("Không thể kết nối đến máy chủ. Kiểm tra địa chỉ IP ở cuối màn hình." referencing the Footer IP-config modal by name) vs generic 500 errors, since it directly points the student/teacher at the fix (Footer's IP config).

---

## Unresolved Questions
1. Header.tsx avatar — didn't inspect exact current markup; confirm during implementation whether `avatar` component needs a fallback-initials variant (likely yes, no user photo upload feature exists).
2. Exact lucide icon choices for the 4 unlabeled Exercises admin action buttons — planner/implementer should map each to its actual function (view/edit/delete/view-submissions per `ViewExerciseModal.tsx`/`ExerciseSubmissionsModal.tsx` existing) rather than guessing here.
3. Whether antd v5's `:where()`-based low-specificity reset fully avoids Tailwind conflicts in THIS app's actual Vite build — flagged as "verify empirically" in §4, recommend a 30-min spike before committing to full Phase 1 rollout.
4. Dark mode explicitly out of scope (none exists today, not requested) — confirm with user it stays out of scope for this phase.

**Status:** DONE
**Summary:** Produced concrete design brief — deepened-blue-on-slate palette (exact oklch/hex for both Tailwind and antd ConfigProvider), Be Vietnam Pro self-hosted font w/ type scale, shared radius/shadow tokens, full shadcn `components.json` + Phase-1 component list with antd-conflict mitigations, sonner as toast standard replacing both react-hot-toast and antd message, routed sidebar AdminLayout spec (VI labels), and empty/loading/error state pattern tailored to the LAN-only backend failure mode.
