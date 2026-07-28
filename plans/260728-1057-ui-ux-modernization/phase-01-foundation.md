# Phase 01 — Foundation

## Context Links

- [Design system brief](../reports/ui-ux-designer-260728-1103-design-system-brief.md) §1–§5 (tokens, font, shadcn setup, sonner)
- [UI inventory](../reports/explore-260728-1057-ui-inventory.md) §6 (styling), §7 bugs 4/7/9
- [Plan overview](./plan.md)

## Overview

- **Priority:** P1 — blocks Phase 02 and 03.
- **Status:** completed (2026-07-28)
- **Effort:** ~10h
- Install and wire the design system (tokens, font, antd theme, shadcn primitives), then land the three shared-infra fixes that every later phase depends on: single auth helper, single backend-asset-URL helper, single toast library. Restyle the three always-mounted chrome components (`Header`, `Footer`, `ServerProtectedRoute`).

## Key Insights

- `main.css` is literally one line (`@import "tailwindcss";`) — zero tokens exist. Everything is greenfield here, no token migration needed.
- No antd `ConfigProvider` exists anywhere: every antd control renders stock `#1677ff`, one shade off the Header's `bg-blue-400`. Adding one provider at root is the single highest-leverage visual change in the whole project.
- Only `@renderer/*` path alias exists (`tsconfig.web.json` + `electron.vite.config.ts`). shadcn CLI assumes `@/*` — must be added in **both** files before the first `shadcn add`.
- `react-hot-toast` is imported in 11 files; antd `message` in 10 more. Both must go in one sweep, otherwise two toast styles ship side by side mid-migration.
- `backendUrl` from localStorage is re-read + string-concatenated in 7 files with three slightly different shapes (`${backendUrl}${url}` vs conditional absolute-URL passthrough in `CurriculumPage`/`Curriculum`). The helper must preserve the absolute-URL passthrough branch or existing links break.
- `constants.ts` exports `API_URL = getApiUrl()` — evaluated once at module load, so it goes stale the moment the user changes the server IP. Grep confirms **zero** consumers. Delete it (latent trap), keep `getApiUrl()`.
- Auth: `JSON.parse(localStorage...)` is unguarded in `Header.tsx:63` and `AdminPage.tsx:39` — malformed value throws and white-screens the app. The new hook must `try/catch`.
- `ServerProtectedRoute` uses native `alert()` twice to tell the user "configure IP in the footer gear icon" — the IP dialog is locked inside `Footer.tsx` local state. Extract it to a shared `ServerConfigDialog` so both can render it. This is the DRY fix that makes §7's "server unreachable" error state actually actionable.

## Requirements

**Functional**
- Tailwind `@theme` exposes the full §1 primitive + semantic palette, §2 type scale, §3 radius/shadow tokens.
- Be Vietnam Pro (400/500/600/700) loads from bundled `.woff2` — verified working with network disabled.
- antd components inherit brand tokens via a single root `ConfigProvider`.
- 13 shadcn primitives available under `@/components/ui/`.
- Exactly one toast system (`sonner`) app-wide; `react-hot-toast` removed from `package.json`.
- One exported `resolveAssetUrl()` used by all asset-URL consumers.
- One `useAuth()` hook; components re-render on login/logout without a manual page reload.

**Non-functional**
- No network access at runtime (no CDN fonts/CSS).
- `bun run typecheck` clean; no new ESLint errors.
- Bundle: only 4 font weights shipped (installer size matters for lab distribution).

## Architecture

```
main.tsx
└── <ConfigProvider theme={antdTheme}>        // new: theme/antd-theme.ts
    └── <HashRouter>
        └── <App>
            ├── <QueryClientProvider>
            │   └── <AppLayout/>              // Header + Routes + Footer
            ├── <Toaster richColors position="top-right"/>   // sonner, replaces react-hot-toast
            └── <DebugPanel/>

lib/backend-url.ts   getBackendBaseUrl() -> string        (localStorage 'backendUrl' | localhost:3000)
                     resolveAssetUrl(path?) -> string      (passthrough if already absolute)
constants.ts         getApiUrl() = `${getBackendBaseUrl()}/api`   (delegates; API_URL deleted)

hooks/use-auth.ts    readAuth(): {token, user} | null      (safe parse, module-level)
                     saveAuth(payload) / clearAuth()       (write + dispatch 'auth-changed')
                     useAuth(): {user, isAuthenticated, isAdmin, logout}   (useSyncExternalStore)
```

Data flow for auth: `LoginPage/RegisterPage → saveAuth() → window.dispatchEvent('auth-changed') → useSyncExternalStore subscribers (Header, RequireAdmin guard) re-render`. Guard reads synchronously during render → no flash (consumed in Phase 03).

## Related Code Files

**Create**
- `src/renderer/src/main.css` (rewrite: `@theme` block + `@font-face` + shadcn vars)
- `src/renderer/src/assets/fonts/be-vietnam-pro-{400,500,600,700}.woff2`
- `src/renderer/src/theme/antd-theme.ts`
- `src/renderer/src/lib/utils.ts` (shadcn `cn`)
- `src/renderer/src/lib/backend-url.ts`
- `src/renderer/src/hooks/use-auth.ts`
- `src/renderer/src/components/ServerConfigDialog.tsx` (extracted from `Footer.tsx`)
- `src/renderer/src/components/ui/*` (13 shadcn components)
- `components.json` (repo root)

**Modify**
- `package.json` (add: `sonner`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, radix deps; remove: `react-hot-toast`, `jotai`)
- `tsconfig.web.json`, `electron.vite.config.ts` (add `@/*` alias)
- `src/renderer/src/main.tsx` (ConfigProvider)
- `src/renderer/src/App.tsx` (Toaster swap)
- `src/renderer/src/constants.ts` (delegate to helper, delete `API_URL`)
- `src/renderer/src/components/Header.tsx`, `Footer.tsx`, `ServerProtectedRoute.tsx` (restyle + use new hooks)
- Toast migration (11 + 10 files): `hooks/useServerHealth.ts`, `pages/{DictionaryPage,AdvanceDictionaryPage,ExercisePage,CurriculumPage,LoginPage,RegisterPage}.tsx`, `pages/admin/tabs/{Dictionary,Execices,Curriculum}.tsx`, `components/{CreateExerciceModal,CurriculumUpload,AudioUpload,ImageUpload}.tsx`
- Asset-URL migration (7 files): `pages/AdvanceDictionaryPage.tsx`, `pages/CurriculumPage.tsx`, `pages/ExercisePage.tsx`, `pages/admin/tabs/Curriculum.tsx`, `components/{ImageUpload,AudioUpload,CurriculumUpload}.tsx`

**Delete**
- `src/renderer/src/states/atoms.ts` (+ the now-empty `states/` dir)

## Implementation Steps

1. **Alias + deps.** Add `"@/*": ["src/renderer/src/*"]` to `tsconfig.web.json` `paths`, and `'@': resolve('src/renderer/src')` to `electron.vite.config.ts` renderer `resolve.alias`. Run `bun add sonner lucide-react class-variance-authority clsx tailwind-merge tw-animate-css`. Verify `bun run typecheck` still clean.
2. **Tokens.** Rewrite `main.css`: `@import "tailwindcss";` + `@theme { … }` with §1 primitives/semantics, §2 type scale, §3 radius/shadow, `--spacing-page: 24px`. Do NOT add dark-mode blocks.
3. **Font.** On an online machine, download Be Vietnam Pro 400/500/600/700 `.woff2` (OFL) into `assets/fonts/`, add four `@font-face` rules + `--font-sans` fallback stack (§2) in `main.css`, set `body { font-family: var(--font-sans) }`. Commit the font binaries. Verify offline: disable network, `bun dev`, confirm glyphs still render (DevTools → Network shows no font request; Computed style shows Be Vietnam Pro).
4. **antd theme.** Create `theme/antd-theme.ts` exporting the §1 `theme.token` + `components` object verbatim. Wrap `main.tsx` root in `<ConfigProvider theme={antdTheme}>` outside `<HashRouter>`.
5. **shadcn init.** Write `components.json` per §4 (style `new-york`, baseColor `slate`, css `src/renderer/src/main.css`, empty `tailwind.config`, lucide, `@/` aliases). Run `bunx shadcn@latest init`. If the CLI rejects the non-standard Vite/Electron layout, fall back to manual: hand-write `lib/utils.ts` (`cn`) and copy component sources from ui.shadcn.com. After init, **review the diff on `main.css`** — overwrite any CLI-generated palette values with the exact §1 oklch values, and check the CLI did not clobber `--font-sans` (§4 point 4).

   **Deviation (recorded 2026-07-28):** `shadcn@latest` (resolved to 4.16.0) is a rewritten CLI defaulting to "Base UI" instead of Radix, with an interactive preset picker, and its "Verifying framework" preflight failed outright for this electron-vite layout (`We could not detect a supported framework`) — confirms the risk-table entry. Pinned `shadcn@2.10.0` (the last classic Radix/new-york-generation CLI) instead: `init` refused to touch an already-present `components.json` and `add button` ran but mis-resolved the `@/` alias, writing to a literal `./@/components/ui/` directory at repo root (alias not detected without a recognized framework config) — deps (`radix-ui`, `class-variance-authority`, `sonner`, `tw-animate-css`, etc.) landed correctly in `package.json` though. Used the manual fallback per this step's own contingency: fetched each of the 13 components (plus 2 transitive registry deps of `sidebar` — `sheet`, `use-mobile`) directly from `https://ui.shadcn.com/r/styles/new-york-v4/<name>.json`, rewrote each file's `@/registry/new-york-v4/...` import paths to the project's `@/lib/utils` / `@/components/ui/*` / `@/hooks/*` aliases, stripped the Next.js-only `"use client"` pragmas, and placed them under the correct `src/renderer/src/{components/ui,hooks}` paths by hand; hand-wrote `lib/utils.ts` (`cn` via `clsx`+`tailwind-merge`, standard shadcn snippet). Deleted the stray `./@` directory. `components.json` unmodified — still exact §4 spec (verified below). One extra deviation: `components/ui/sonner.tsx`'s registry source imports `next-themes` purely to detect light/dark — since this app has no dark mode (locked decision), that import was dropped and `theme="light"` hardcoded instead, avoiding an unnecessary dependency (YAGNI).
6. **Conflict spike (gate — 30 min, do before step 7).** Temporarily render an antd `<Button type="primary">` next to a shadcn `<Button>` and a `<div className="bg-primary-500 rounded-lg shadow-md">` on `/`. Verify: same blue, same radius, no reset bleed (heading margins, box-sizing), shadcn Dialog renders above antd Modal-less content. Record the outcome in this file. If Tailwind utilities lose to antd styles on antd elements → confirm the documented rule (ConfigProvider for color/radius, Tailwind only for layout on wrappers) and proceed; do NOT introduce `!important` sweeps.

   **Spike outcome (recorded 2026-07-28):** PASS, empirically verified — not just code review. Method: temporarily added `<Button type="primary">` (antd), `<button className="bg-primary-500 rounded-lg shadow-md">` (Tailwind), and `<Button>` (shadcn, `@/components/ui/button`) side by side on `/`, ran `ELECTRON_DISABLE_SANDBOX=1 bun dev` (electron-vite's Vite dev server listens on `http://localhost:5173` independent of the Electron window), then loaded that URL in `google-chrome --headless=new --no-sandbox` and captured a screenshot (Chromium is the same rendering engine Electron 35 embeds, so this is a valid proxy for the in-app render). Result: all three buttons render the identical blue (`#3B6BEF` primary-500, matching both the antd `ConfigProvider` token and the Tailwind `--color-primary-500` var) and the same ~8px rounded radius, no visible CSS reset bleed (button padding/heading margins normal), Vietnamese diacritics rendered correctly, no console errors. Spike code removed after capture — `git diff` confirms `DictionaryPage.tsx` is clean of spike markup. **Rule confirmed and followed for the rest of Phase 01:** antd components are themed exclusively via `ConfigProvider`/`theme/antd-theme.ts` tokens (color, radius); Tailwind classes are used on antd elements only for layout/spacing (margin, flex, width), never color/radius overrides. z-index (shadcn Radix portal vs antd Modal) not empirically tested — no page in this app opens both simultaneously today (confirmed via code read of all `Modal`/`Dialog` usages), so the documented procedural rule (never nest them) is adopted without further testing, per the risk table's own mitigation.
7. **shadcn components.** `bunx shadcn@latest add button card dialog input badge dropdown-menu sonner sidebar avatar separator skeleton tooltip alert-dialog`. Confirm they land in `src/renderer/src/components/ui/`.
8. **Toast unification.** Swap `<Toaster/>` in `App.tsx` from `react-hot-toast` to `sonner` (`richColors`, `position="top-right"`). Sweep all 11 `react-hot-toast` importers → `import { toast } from 'sonner'` (API is call-compatible for `toast.success/error/loading`; check `toast.promise`/custom usages individually). Sweep antd `message.success/error/warning/info` → `toast.*`, removing now-unused antd imports. `bun remove react-hot-toast`. Final grep must return zero hits for `react-hot-toast` and for `message.` in `src/renderer`.
9. **Backend URL helper.** Create `lib/backend-url.ts`; port the absolute-URL passthrough branch (present in `CurriculumPage.tsx:30-33`, `admin/tabs/Curriculum.tsx:83-86`) into `resolveAssetUrl`. Replace all 7 duplicated blocks with imports; drop the stray `console.log` debug lines in `ImageUpload.tsx:70` and `AdvanceDictionaryPage.tsx:238`. Update `constants.ts` to delegate and delete `API_URL`. **Do not touch** `axios-client.ts` beyond confirming it still calls `getApiUrl()` in both `baseURL` assignments (the recently-fixed `uploadClient` line must stay).
10. **Auth helper.** Create `hooks/use-auth.ts` per Architecture. Rewire `Header.tsx` (drop inline parse) and `LoginPage.tsx`/`RegisterPage.tsx` writes to `saveAuth()`; logout menu items → `logout()`. `AdminPage.tsx` is rewired in Phase 03. Delete `states/atoms.ts`, `bun remove jotai` (grep first: must be zero importers).
11. **Chrome restyle.** `Header.tsx`: `bg-primary-600` bar, shadcn `dropdown-menu` + `avatar` (initials fallback from `user.fullName`) replacing antd `Dropdown`/`Space`, logo via plain `<img>` (drop antd `Image` — no preview needed). `Footer.tsx`: neutral-50 bar, border-top, extract the IP modal into `ServerConfigDialog.tsx` (antd `Form` inside a shadcn `dialog`, or keep antd `Modal` if the Form binding is fiddly — prefer shadcn dialog + antd Form fields). `ServerProtectedRoute.tsx`: replace both `alert()` calls with an inline `ServerConfigDialog` trigger, restyle the two `Result` states with the §7 error pattern and the exact "server unreachable" copy: `Không thể kết nối đến máy chủ. Kiểm tra địa chỉ IP ở cuối màn hình.`
12. **Verify.** `bun run typecheck` → `bun run lint` → `bun dev` smoke (see Success Criteria).

## Todo List

- [x] 1. `@/*` alias in tsconfig.web.json + electron.vite.config.ts; install deps
- [x] 2. `main.css` `@theme` tokens (color/type/radius/shadow/spacing-page)
- [x] 3. Self-host Be Vietnam Pro 4 weights + `@font-face`; verify offline
- [x] 4. `theme/antd-theme.ts` + `ConfigProvider` at `main.tsx` root
- [x] 5. `components.json` + `shadcn init`; reconcile generated CSS vars with §1
- [x] 6. antd/Tailwind conflict spike — record result here
- [x] 7. Add 13 shadcn components
- [x] 8. Migrate 21 files to sonner; remove `react-hot-toast`
- [x] 9. `lib/backend-url.ts`; dedupe 7 sites; delete `API_URL`
- [x] 10. `hooks/use-auth.ts`; rewire Header/Login/Register; delete `atoms.ts` + jotai
- [x] 11. Restyle Header / Footer / ServerProtectedRoute; extract `ServerConfigDialog`
- [x] 12. typecheck + lint + smoke test

## Success Criteria

- `bun run typecheck` passes. `bun run lint` has 25 pre-existing errors/38 warnings on `master` unrelated to this phase (verified via `git stash` diff: baseline had 30 errors on the same lines; this phase net-fixed 5 and introduced 0 new ones) — cleaning up that pre-existing debt is a separate follow-up, not a Phase 01 blocker.
- `grep -r "react-hot-toast" src/` → 0 hits; `grep -rn "message\." src/renderer` → 0 antd message calls; `react-hot-toast` and `jotai` absent from `package.json`.
- `grep -rn "localStorage.getItem('backendUrl')" src/renderer` → 1 hit, in `lib/backend-url.ts` (plus `useServerHealth.ts` which may keep its own read for the IP-extraction path, or use the helper — either is fine as long as the string literal default lives in one place).
- With the network adapter disabled, `bun dev` renders Be Vietnam Pro (verify via DevTools Computed → font-family, and no failed font request).
- antd primary buttons and shadcn buttons render the same blue (`#3B6BEF`) and the same 8px radius, side by side.
- Login → Header shows the user name without a manual refresh; logout → shows "Đăng nhập" immediately.
- Setting a bad IP in the footer dialog produces the new Vietnamese unreachable-server error state with a working config button (no native `alert()` anywhere: `grep -rn "alert(" src/renderer` → 0).

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| antd runtime CSS overrides Tailwind utilities on antd elements | Med × Med | Step 6 spike gates rollout; documented rule = tokens for color/radius, Tailwind for layout only |
| shadcn CLI refuses this Vite+Electron layout / rewrites `main.css` badly | Med × Low | Manual-copy fallback documented in step 5; review the CSS diff before committing |
| Font download requires internet at build time | Low × High | Do step 3 first while online; commit binaries to git so lab/offline rebuilds work |
| Toast sweep misses a call site → mixed styles ship | Med × Low | Grep-based success criteria; removing the dep makes any miss a compile error |
| `resolveAssetUrl` drops the absolute-URL passthrough → broken curriculum/image links | Low × High | Port both branches; smoke test one curriculum download + one dictionary image |
| Removing `jotai`/`API_URL` breaks an unseen consumer | Low × Med | Grep before removal (both currently zero); typecheck catches the rest |
| z-index: shadcn Radix portal under antd Modal (z ~1000) | Low × Med | Rule: never open a shadcn overlay while an antd Modal is open (no such page exists today) |

## Security Considerations

- `useAuth` must `try/catch` the JSON parse and treat malformed/absent values as logged-out — currently an unguarded parse can white-screen the app.
- Role is still client-side only (from the stored token payload). This pass fixes the *flash*, not the trust model: the backend must remain the authority for admin endpoints. Do not add any capability that relies on the client's role claim being tamper-proof.
- Font files ship locally — no third-party CDN requests, keeps the app fully LAN-only.

## Next Steps

- Unblocks Phase 02 (user panel) and Phase 03 (admin panel), which can run in parallel.
- Report the step-6 spike outcome back into this file before starting either.
