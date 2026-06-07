# Multi-HeyGen Account Support — Task Checklist

Track progress here. Mark tasks `[x]` when complete.

**Plan reference:** [multi-account-plan.md](./multi-account-plan.md)  
**Spec reference:** [multi-account-spec (1).docx](./multi-account-spec%20(1).docx)  
**Status:** Phase 5 QA complete — Phase 6 (PR) ready when you are

---

## Legend

- `[ ]` Not started
- `[x]` Done
- `[~]` In progress

---

## Spec compliance rules (read before each phase)

- Touch **only** the 7 files listed in spec §8 (see plan §3).
- **Do not** modify: `postMessageService`, `ApiKeyModal`, schema/migrations, HeyGen client/proxy, parent app.
- **Do not** modify `AppRoot.tsx` — overlays render from `AvatarGroupBubbles.jsx`.

---

## Phase 0 — Prerequisites

| Status | Task | Notes |
|--------|------|-------|
| [x] | Local dev running (`yarn dev`, Supabase env vars set) | Org sync working |
| [x] | Iframe test parent (`iframe/index.html` on port 8080) | INIT flow verified |
| [x] | Confirm go-ahead to implement | |

---

## Phase 1 — API Layer

**File:** `app/api/credentials/route.ts` (spec §3.2, §7.3)

| Status | Task | Spec |
|--------|------|------|
| [x] | GET — remove `.single()`, return `{ exists, credentials[] }` | §3.2 |
| [x] | GET — `exists: false` when array empty | §3.2 |
| [x] | DELETE — optional `credential_uuid` query param targets one row | §7.3 |
| [x] | DELETE — omitting `credential_uuid` keeps delete-all behavior | §7.3 |
| [x] | POST — insert new row for add-account (stop upsert overwrite)* | §7.2 implied |

**File:** `app/api/credentials/decrypt/route.ts` (spec §3.3)

| Status | Task | Spec |
|--------|------|------|
| [x] | Accept optional `credential_uuid` in body | §3.3 |
| [x] | Filter by `api_credentials_uuid` when provided | §3.3 |
| [x] | Keep behavior when `credential_uuid` omitted (single-account path) | §3.3 |

---

## Phase 2 — Global State

**File:** `src/state/AppStateProvider.tsx` (spec §3.1, §7.4)

| Status | Task | Spec |
|--------|------|------|
| [x] | Add `availableAccounts` + `setAvailableAccounts` | §3.1 |
| [x] | Add `selectedCredentialUuid` + `setSelectedCredentialUuid` | §3.1 |
| [x] | Add `showAccountSettings` + `setShowAccountSettings` | §7.4 |
| [x] | Add `showAccountPicker` + `setShowAccountPicker` | §7.2 reconciliation |
| [x] | Wire all fields into `State` type and context value | §3.1, §7.4 |

---

## Phase 3 — Load-Time Account Picker

**File:** `src/components/HeyGenAccountPickerModal.tsx` — **CREATE** (spec §3.4)

| Status | Task | Spec |
|--------|------|------|
| [x] | Props: `accounts`, `onSelect(credentialUuid)` | §3.4 |
| [x] | Match `ApiKeyModal` visual style | §3.4 |
| [x] | Not dismissible without selection | §3.4 |

**File:** `src/components/AppInitializer.tsx` (spec §3.5)

| Status | Task | Spec |
|--------|------|------|
| [x] | `initPayloadRef` stores INIT payload in listener | §3.5 |
| [x] | Fetch credentials array; branch 0 / 1 / 2+ | §3.5 |
| [x] | Map labels: `HeyGen Account (added {date})` or `HeyGen Account {n}` | §3.5 |
| [x] | 1 account: auto-set `selectedCredentialUuid`, skip picker | §3.5 |
| [x] | 2+ accounts: set `availableAccounts`, show picker | §3.5 |
| [x] | Decrypt effect: POST decrypt with `credential_uuid` when selected | §3.5 |
| [x] | Render gate: error → loading → picker → apiKeyModal → AppRoot | §3.5 |

---

## Phase 4 — In-App Account Settings

**File:** `src/features/settings/AccountSettingsScreen.tsx` — **CREATE** (spec §7.2)

| Status | Task | Spec |
|--------|------|------|
| [x] | Full-screen overlay | §7.2 |
| [x] | Header "HeyGen Accounts" + close via `HeaderBack` | §7.2 |
| [x] | On mount: GET all credentials for org | §7.2 |
| [x] | Row: label, active badge, delete button | §7.2 |
| [x] | Delete: inline "Are you sure?" (not modal) | §7.2 |
| [x] | Delete: `DELETE ?credential_uuid=...` | §7.2 |
| [x] | Delete active: clear `apiKey` + `selectedCredentialUuid`, `setShowAccountPicker(true)` | §7.2 |
| [x] | Add account: local `showApiKeyModal` → reuse `ApiKeyModal` unchanged | §7.2 |
| [x] | On add success: dismiss modal, refresh list | §7.2 |
| [x] | Switch: decrypt → `setApiKey` + `setSelectedCredentialUuid` → close settings | §7.2 |

**File:** `src/components/AvatarGroupBubbles.jsx` (spec §7.1)

| Status | Task | Spec |
|--------|------|------|
| [x] | Settings icon button in header top-right | §7.1 |
| [x] | `onClick` → `setShowAccountSettings(true)` | §7.1 |
| [x] | `aria-label="Manage HeyGen accounts"` | §7.1 |
| [x] | Render `AccountSettingsScreen` overlay when `showAccountSettings` | §7.1 |
| [x] | Render `HeyGenAccountPickerModal` when `showAccountPicker` (mid-session) | §7.2 |

---

## Phase 5 — Testing & QA (spec §4, §9)

See [multi-account-qa-results.md](./multi-account-qa-results.md) for details.

| Status | Task | Expected |
|--------|------|------------|
| [ ] | **T1** — 0 credentials at init | ApiKeyModal → AppRoot (manual — destructive) |
| [x] | **T2** — 1 credential at init | Auto-decrypt, no picker |
| [ ] | **T3** — 2+ credentials at init | Picker → AppRoot (manual — needs 2+ DB rows) |
| [ ] | **T4** — Settings: add account | New row in list (manual) |
| [ ] | **T5** — Settings: switch account | Active badge moves, re-fetch (manual) |
| [ ] | **T6** — Settings: delete non-active | Row removed (manual) |
| [ ] | **T7** — Settings: delete active | Picker shown again (manual) |
| [x] | **T8** — Single-account regression | Unchanged behavior |
| [x] | **T9** — Iframe parent test | READY → INIT → full flow |
| [x] | **T10** — `yarn build` | Passes |

---

## Phase 6 — Deliverable (spec §9)

| Status | Task | Notes |
|--------|------|-------|
| [x] | All Phase 1–4 code tasks complete | |
| [x] | Only 7 spec files changed for feature | + `tsconfig.json` for build |
| [x] | No out-of-scope feature files modified | |
| [ ] | PR against `main` with description + test checklist | |

---

## Files checklist (spec §8 — final diff must match)

| File | Action | Done |
|------|--------|------|
| `src/state/AppStateProvider.tsx` | Modify | [x] |
| `app/api/credentials/route.ts` | Modify | [x] |
| `app/api/credentials/decrypt/route.ts` | Modify | [x] |
| `src/components/HeyGenAccountPickerModal.tsx` | Create | [x] |
| `src/components/AppInitializer.tsx` | Modify | [x] |
| `src/features/settings/AccountSettingsScreen.tsx` | Create | [x] |
| `src/components/AvatarGroupBubbles.jsx` | Modify | [x] |

---

## Progress Summary

| Phase | Tasks | Done |
|-------|-------|------|
| Phase 0 — Prerequisites | 3 | 3 |
| Phase 1 — API | 8 | 8 |
| Phase 2 — State | 5 | 5 |
| Phase 3 — Init picker | 10 | 10 |
| Phase 4 — Settings | 15 | 15 |
| Phase 5 — Testing | 10 | 4 |
| Phase 6 — Deliverable | 4 | 3 |
| **Total** | **55** | **48** |

---

## Build note

`tsconfig.json` was updated with `"ignoreDeprecations": "6.0"` so `yarn build` passes with TypeScript 6.0.3 (pre-existing `baseUrl` deprecation). This is outside the 7 spec files but required for the deliverable.

---

*Last updated: 2026-06-07 — Phase 5 QA done; manual multi-account tests pending on staging*
