# Phase 02 — User Panel

## Context Links

- [Design system brief](../reports/ui-ux-designer-260728-1103-design-system-brief.md) §3 (spacing), §7 (empty/loading/error)
- [UI inventory](../reports/explore-260728-1057-ui-inventory.md) §2 user pages, §7 bug 3
- [Phase 01](./phase-01-foundation.md) — blocker
- [Plan overview](./plan.md)

## Overview

- **Priority:** P2
- **Status:** pending (blocked by Phase 01)
- **Effort:** ~8h
- Restyle the 6 student-facing pages and 6 shared components onto the new tokens/primitives, and give every async surface a real loading / empty / error state.

## Key Insights

- These pages are the largest in the repo (`AdvanceDictionaryPage` 433, `ExercisePage` 415, `DictionaryPage` 278) and none use react-query — they hand-roll `useState`/`useEffect`/`try-catch`. **Do not convert them to react-query in this phase**: it changes data-flow semantics and is not a UI/UX requirement (YAGNI). Add states to the existing async paths.
- `DictionaryPage` and `AdvanceDictionaryPage` share ~40% lookup logic (recents/saved localStorage arrays, debounce, speak, favorite) but under **different storage keys** (`recents`/`saved` vs `advance_recents`/`advance_saved`) and different result shapes (local IPC dictionary vs backend API). **Decision: defer the extraction.** A shared hook would need to be parameterized by storage key + fetcher + result shape, i.e. an abstraction over two callers with divergent data — the classic premature-DRY trap, and it would double this phase's regression surface. Ship the restyle; file a follow-up. Only extract the trivially identical bit if it appears verbatim: the `recents`/`saved` localStorage list helper (`hooks/use-word-list.ts`, key passed as arg) — that one is safe and mechanical.
- `ExercisePage` renders audio URLs inline at line ~318 — Phase 01 already replaced that block with `resolveAssetUrl`; here only markup changes.
- Upload components (`ImageUpload`, `AudioUpload`, `CurriculumUpload`) are **visual-only** in this phase. Rule of thumb for review: the diff must not touch any line containing `window.api`, `uploadClient`, `dictionaryApi.upload*`, `FormData`, or `readFile`.
- Two distinct empty states on the dictionary pages, per §7: pre-search (`Nhập từ để tra cứu`) vs no-results (`Không tìm thấy kết quả`). Today both collapse into one static placeholder.

## Requirements

**Functional**
- Every page uses `p-6` (`--spacing-page`) outer padding and the `text-h1` token for its title.
- Search/lookup surfaces show a shaped `skeleton` while in flight, a distinct empty state for "not searched yet" vs "no results", and the §7 inline error block with a working `Thử lại` retry.
- Curriculum grid, exercise list, and dictionary results all use the shared state components.
- All Vietnamese copy preserved verbatim except where §7 prescribes new empty/error strings.

**Non-functional**
- No changes to upload/IPC/API logic anywhere in this phase.
- No mobile breakpoint classes added (`sm:`/`md:` only if already present and load-bearing for the fixed desktop window).
- Each touched file stays under ~250 lines where practical; extract sub-blocks rather than growing files.

## Architecture

Three small shared state components (created here, reused by Phase 03):

```
components/states/empty-state.tsx    <EmptyState icon message action?/>      lucide 48px neutral-300, centered
components/states/error-state.tsx    <ErrorState variant="offline"|"generic" onRetry/>
                                     offline copy: "Không thể kết nối đến máy chủ.
                                                    Kiểm tra địa chỉ IP ở cuối màn hình."
components/states/loading-skeleton.tsx  named shaped skeletons (list / grid / entry)
```

Error variant selection: treat an axios error with no `response` (network/ECONNREFUSED) as `offline`, anything else as `generic`. Put that classification in one helper next to `ErrorState` so Phase 03 reuses it.

## Related Code Files

**Create**
- `src/renderer/src/components/states/empty-state.tsx`
- `src/renderer/src/components/states/error-state.tsx`
- `src/renderer/src/components/states/loading-skeleton.tsx`
- `src/renderer/src/hooks/use-word-list.ts` (only if the recents/saved helper is verbatim-identical across both dictionary pages)

**Modify**
- `src/renderer/src/pages/DictionaryPage.tsx`
- `src/renderer/src/pages/AdvanceDictionaryPage.tsx`
- `src/renderer/src/pages/ExercisePage.tsx`
- `src/renderer/src/pages/CurriculumPage.tsx`
- `src/renderer/src/pages/LoginPage.tsx`
- `src/renderer/src/pages/RegisterPage.tsx`
- `src/renderer/src/components/DictionaryEntry.tsx`
- `src/renderer/src/components/ImageUpload.tsx` *(visual only)*
- `src/renderer/src/components/AudioUpload.tsx` *(visual only)*
- `src/renderer/src/components/CurriculumUpload.tsx` *(visual only)*
- `src/renderer/src/components/ViewExerciseModal.tsx`
- `src/renderer/src/components/ExerciseSubmissionsModal.tsx`
- `src/renderer/src/layouts/AppLayout.tsx` *(main-area background/padding only — no route changes; Phase 03 owns the route table)*

**Delete** — none.

**File ownership vs Phase 03:** Phase 03 owns `layouts/AppLayout.tsx` route edits. To avoid a collision, either land 02 before 03's routing step, or let Phase 03 own `AppLayout.tsx` entirely and have 02 skip it (background/padding can move into `AdminLayout`/page wrappers instead). Default: **Phase 03 owns `AppLayout.tsx`**; Phase 02 must not edit it.

## Implementation Steps

1. **Shared state components.** Build `EmptyState`, `ErrorState` (+ offline/generic classifier), and the three shaped skeletons. Vietnamese copy per §7.
2. **DictionaryPage.** shadcn `input` + `card` for the search panel; recents/saved as shadcn `badge` pills; skeleton on lookup; the two distinct empty states; error state on IPC failure. Keep the flag-icon dictionary switch, restyle as a segmented pair of buttons.
3. **DictionaryEntry.** Token-based typography (`text-h2` word, `text-small` pronunciation), shadcn `tooltip` on the speak and favorite icon buttons, `separator` between sections. `dangerouslySetInnerHTML` for Quill HTML stays — scope it under a `prose`-ish wrapper class so its typography inherits the tokens.
4. **AdvanceDictionaryPage.** Same treatment; restyle the result `Card` and image gallery (uses `resolveAssetUrl` from Phase 01). Extract the recents/saved localStorage helper only if verbatim-identical to DictionaryPage's.
5. **ExercisePage.** Two-column layout on the new grid/padding; left list as shadcn `card` rows with `badge` for completed/score; right quiz panel restyled (radio MCQs, audio player, submit/reset); keep the circular score progress (antd `Progress`, now themed). Skeleton for list load, `EmptyState` for no exercises.
6. **CurriculumPage.** shadcn `card` grid, file-type `badge`, `tooltip` on download buttons, `EmptyState` for "no files match filter", skeleton grid on load.
7. **Login / Register.** Centered card, `text-display` heading, antd `Form` retained (validation already wired) with themed inputs; error feedback via sonner. These are the smallest files — do them last as a consistency check on the token set.
8. **Modals.** `ViewExerciseModal` and `ExerciseSubmissionsModal`: keep antd `Modal` shells (themed), restyle inner content with tokens + `badge` for correct/incorrect.
9. **Upload widgets (visual only).** Restyle the file-picker buttons, thumbnail grid, and audio player chrome of `ImageUpload`/`AudioUpload`/`CurriculumUpload`. Touch no logic lines.
10. **Verify.** `bun run typecheck`, `bun run lint`, then the smoke checklist.

## Todo List

- [x] 1. `EmptyState` / `ErrorState` (+ offline classifier) / shaped skeletons
- [x] 2. DictionaryPage restyle + 3 states
- [x] 3. DictionaryEntry restyle + tooltips
- [x] 4. AdvanceDictionaryPage restyle + 3 states
- [x] 5. ExercisePage restyle + list skeleton/empty
- [x] 6. CurriculumPage restyle + grid skeleton/empty
- [x] 7. LoginPage + RegisterPage restyle
- [x] 8. ViewExerciseModal + ExerciseSubmissionsModal restyle
- [x] 9. ImageUpload / AudioUpload / CurriculumUpload — visual only
- [x] 10. typecheck + lint + smoke

## Success Criteria

- `bun run typecheck` passes (verified clean). `bun run lint`: 21 errors/35 warnings on the full working tree after all 3 phases, vs 30 errors/38 warnings on unmodified `master` (verified via `git stash -u` true-baseline comparison) — net improvement, zero new errors introduced by this phase. Pre-existing debt, not a Phase 02 blocker (same caveat as Phase 01).
- Manual interactive `bun dev` smoke (search flow, offline error state, upload-after-IP-change) not performed — no window-manager/GUI-interaction tooling available in the implementation sandbox. Verified instead via: forbidden-token diff on the 3 upload components (clean, 0 hits), code-level review that `resolveAssetUrl`/`useAuth`/state components are wired correctly, and typecheck. Recommend a real manual pass on a dev machine before shipping.
- Smoke (`bun dev`, backend running): search a word → skeleton → result; search gibberish → "Không tìm thấy kết quả"; clear input → "Nhập từ để tra cứu".
- Stop the backend → `/advanced-dictionary`, `/exercise`, `/curriculum` each show the offline error copy naming the footer IP, and `Thử lại` recovers after the backend restarts.
- Upload smoke: add an image to a dictionary entry, add audio to an exercise question, upload a curriculum document — all still succeed, and files still resolve after changing the server IP in the footer (this is the regression guard for the recent `uploadClient.baseURL` fix).
- `git diff` on the three upload components contains no changed line matching `window.api|uploadClient|dictionaryApi.upload|FormData|readFile`.
- Every icon-only button on these pages has a tooltip.
- All pre-existing Vietnamese strings unchanged (`git diff` review — no English leaked in).

## Risk Assessment

| Risk | L×I | Mitigation |
|---|---|---|
| Upload/IPC regression from "just restyling" | Med × High | Explicit forbidden-token diff rule + upload smoke test in success criteria |
| Scope creep into a shared dictionary hook / react-query migration | High × Med | Explicitly deferred above; only the verbatim localStorage helper may be extracted |
| Vietnamese copy accidentally reworded during rewrite | Med × Med | Copy is preserve-only; diff review step; new strings limited to the §7 list |
| Large files (415/433 lines) get harder to review after edits | Med × Low | Extract presentational sub-blocks into local components rather than growing the file |
| Skeletons applied everywhere → jank on fast local IPC lookups | Med × Low | §7 rule: skeleton only for primary content loads; sub-300ms actions keep inline `Spin` |

## Security Considerations

- `dangerouslySetInnerHTML` on Quill-authored definitions stays as-is (admin-authored content, existing behavior). Do not widen it to any user-submitted field. If sanitization is wanted later, that is a separate scoped task, not a styling change.
- Error states must not surface raw axios error objects / stack traces / internal URLs to students — show the Vietnamese message only.

## Next Steps

- Follow-up candidate (out of scope): unify DictionaryPage/AdvanceDictionaryPage lookup logic, and/or migrate user pages to react-query for consistent retry/caching.
- `EmptyState`/`ErrorState`/skeletons are consumed by Phase 03's admin tables (`Table.locale.emptyText`).
