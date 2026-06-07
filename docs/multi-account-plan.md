# Multi-HeyGen Account Support — Implementation Plan

**Project:** HeyGen Iframe App  
**Feature:** Account picker at initialization + in-app account management  
**Scope:** Child app only (iframe) — no parent app changes  
**Stack:** Next.js App Router, TypeScript, React, Supabase  
**Spec source:** `docs/multi-account-spec (1).docx`  
**Status:** Plan reviewed against spec — ready for implementation confirmation

---

## 1. Problem Statement (from spec §1)

A single organization may have **multiple HeyGen API keys** in Supabase. Today the app loads the **first** credential (`.single()`). Users must:

1. **At init:** Choose which account to use when 2+ credentials exist.
2. **After load:** Add, delete, or switch accounts from in-app settings.

All logic stays in the iframe child app. **No parent app or INIT payload changes.**

---

## 2. Current vs Target Flow

### Current (`AppInitializer.tsx` — spec §2)

```
1. READY → 2. INIT → 3. POST /api/organizations
→ 4. GET /api/credentials (single)
   5a. none → ApiKeyModal
   5b. exists → POST decrypt → AppRoot
→ 6. AppRoot
```

### Target init flow (spec §3.5)

```
1. READY → 2. INIT → 3. POST /api/organizations
→ 4. GET /api/credentials (array)
   • 0 → ApiKeyModal
   • 1 → auto-select → decrypt → AppRoot
   • 2+ → HeyGenAccountPickerModal → select → decrypt → AppRoot
→ 5. decrypt (pass credential_uuid when selected)
→ 6. AppRoot
```

### Target settings flow (spec §7)

```
Settings icon (AvatarGroupBubbles header)
→ showAccountSettings = true
→ AccountSettingsScreen overlay (inside AppRoot tree)
   • List accounts + active badge
   • Tap row → switch (decrypt + setApiKey)
   • Delete → DELETE with credential_uuid
   • Add → ApiKeyModal (unchanged) → refresh list
```

---

## 3. Files to Create or Modify (spec §5 + §8 — authoritative list)

| File | Action | Spec section |
|------|--------|--------------|
| `src/state/AppStateProvider.tsx` | Modify | §3.1, §7.4 |
| `app/api/credentials/route.ts` | Modify | §3.2, §7.3 |
| `app/api/credentials/decrypt/route.ts` | Modify | §3.3 |
| `src/components/HeyGenAccountPickerModal.tsx` | **Create** | §3.4 |
| `src/components/AppInitializer.tsx` | Modify | §3.5 |
| `src/features/settings/AccountSettingsScreen.tsx` | **Create** | §7.2 |
| `src/components/AvatarGroupBubbles.jsx` | Modify | §7.1 |

**Only these 7 files.** No other source files may be changed.

---

## 4. Explicitly Out of Scope (spec §6 — do not touch)

| Item | Rule |
|------|------|
| Parent app / INIT payload | No changes |
| `postMessageService` / postMessage handling | No changes |
| `ApiKeyModal` | Reuse as-is; do not modify |
| **Supabase schema** | **No new tables, columns, or migrations** |
| HeyGen client, proxy, video/avatar logic | No changes |
| Any file not in §3.5 / §8 file list | No changes |

> **Note on schema:** Spec assumes multiple credential rows already work in the client's database ("no new tables or columns needed"). We do **not** ship SQL migrations. If a local DB still has `UNIQUE(organization_uuid, provider)` from repo `001_initial_schema.sql`, that is **outside this PR** — client handles DB separately.

---

## 5. State Changes (`AppStateProvider.tsx`)

### Spec §3.1 — picker state

```typescript
availableAccounts: { credential_uuid: string; label: string }[];
setAvailableAccounts: (accounts: ...) => void;

selectedCredentialUuid: string | null;
setSelectedCredentialUuid: (uuid: string | null) => void;
```

### Spec §7.4 — settings visibility

```typescript
showAccountSettings: boolean;
setShowAccountSettings: (show: boolean) => void;
```

### Spec reconciliation — mid-session account picker (§7.2)

§3.5 shows `showAccountPicker` as **local** state in `AppInitializer`. §7.2 requires showing the picker again after deleting the **active** account while `AppRoot` is mounted (AppInitializer local state is no longer on screen).

**Approach (minimal, no extra files):** Add to `AppStateProvider`:

```typescript
showAccountPicker: boolean;
setShowAccountPicker: (show: boolean) => void;
```

- **Init:** `AppInitializer` uses this global flag (same render gate pattern as §3.5).
- **Settings delete active:** `AccountSettingsScreen` sets `showAccountPicker = true`, clears `apiKey` + `selectedCredentialUuid`.
- **Picker UI:** Render `HeyGenAccountPickerModal` from `AvatarGroupBubbles` (or `AccountSettingsScreen` parent) when flag is true — stays inside AppRoot tree per §7.1 without modifying `AppRoot.tsx`.

`AppRoot.tsx` is **not** in the spec file list — do not modify it.

---

## 6. API Changes

### GET `/api/credentials` (spec §3.2)

**Before:** `{ exists, credential }` via `.single()`  
**After:** `{ exists, credentials: [] }` — remove `.single()`, return array; `exists: false` when empty.

### POST `/api/credentials/decrypt` (spec §3.3)

Add optional body field `credential_uuid`. When set, filter `.eq('api_credentials_uuid', credential_uuid)` before `.single()`.

### DELETE `/api/credentials` (spec §7.3)

Add optional query param `credential_uuid`. When set, delete one row; when omitted, keep existing delete-all behavior.

### POST `/api/credentials` — insert vs upsert (not spelled out in spec)

Spec does **not** mention changing POST. `ApiKeyModal` (unchanged) POSTs to this route for "Add account". Current code **upserts** (overwrites the only row). For a true second account, POST must **insert** a new row — this is a change inside `app/api/credentials/route.ts` only (in-scope file), without touching `ApiKeyModal`.

---

## 7. Component Details

### `HeyGenAccountPickerModal.tsx` (spec §3.4)

- Props: `accounts: { credential_uuid, label }[]`, `onSelect(uuid)`
- Match `ApiKeyModal` styling
- **Not dismissible** without selection
- Never shown when only 1 account

### `AppInitializer.tsx` (spec §3.5)

- `initPayloadRef` for deferred decrypt after async picker
- Label: `HeyGen Account (added {date})` if `created_at` exists, else `HeyGen Account {n}`
- Render order: `error` → `!isInitialized` → `isCheckingApiKey` → `showAccountPicker` → `showApiKeyModal` → `AppRoot`
- Pass `credential_uuid` to decrypt when selected

### `AccountSettingsScreen.tsx` (spec §7.2)

- Header: "HeyGen Accounts" + `HeaderBack` close
- Fetch credentials on mount via GET endpoint
- Rows: label, active badge, delete with **inline** confirm (not modal)
- Add account → local `showApiKeyModal` → existing `ApiKeyModal`
- On add success: dismiss modal, refresh list (auto-select new account is **optional** per spec)
- Switch: decrypt → `setApiKey` + `setSelectedCredentialUuid` → close settings
- Delete active: clear key + UUID, set `showAccountPicker = true`

### `AvatarGroupBubbles.jsx` (spec §7.1)

- Settings icon top-right on main header
- `onClick` → `setShowAccountSettings(true)`
- Render `AccountSettingsScreen` overlay when `showAccountSettings`
- Render `HeyGenAccountPickerModal` when `showAccountPicker` (mid-session re-pick)

---

## 8. Backward Compatibility (spec §4)

| Scenario | After change |
|----------|--------------|
| 0 credentials | ApiKeyModal — unchanged |
| 1 credential | Auto-decrypt, no picker — unchanged |
| 2+ credentials | Picker shown, user selects |

---

## 9. Deliverable (spec §9)

Single PR against `main`:

- [ ] Only the 7 files listed in §3 above
- [ ] `yarn build` passes (no TypeScript errors)
- [ ] Works for 0, 1, 2+ credential scenarios
- [ ] Add / delete / switch from settings screen
- [ ] No regression on single-account flow
- [ ] PR body: short approach summary + test checklist

---

## 10. Testing Plan

| # | Scenario | Expected |
|---|----------|----------|
| T1 | 0 credentials at init | ApiKeyModal → save → AppRoot |
| T2 | 1 credential at init | No picker, auto-decrypt |
| T3 | 2+ credentials at init | Picker → select → AppRoot |
| T4 | Settings: add account | List refreshes, new row visible |
| T5 | Settings: switch account | Active badge moves, data re-fetches |
| T6 | Settings: delete non-active | Row removed |
| T7 | Settings: delete active | Picker shown again |
| T8 | Single-account regression | Same as today |
| T9 | Iframe test parent | READY → INIT → full flow |
| T10 | `yarn build` | Clean build |

**Local test setup:** `yarn dev` :3000 + `iframe/index.html` on :8080

---

## 11. Open Decisions (optional — spec allows either)

| Question | Spec guidance | Default if no answer |
|----------|---------------|----------------------|
| Auto-select after "Add account"? | "Optionally auto-select… or leave current unchanged" | Keep current active |
| DB supports 2+ rows locally? | Schema out of scope | Test 2+ on client staging DB |

---

## 12. Spec vs Our Earlier Plan — Corrections Applied

| Earlier plan item | Correction per docx |
|-------------------|---------------------|
| DB migration `005_...sql` | **Removed** — spec §6 forbids schema changes |
| Modify `AppRoot.tsx` | **Removed** — not in spec file list; overlays live in `AvatarGroupBubbles` |
| Block implementation on client schema OK | **Removed** — proceed per spec; schema is client-side |
| `showAccountPicker` only local | **Reconciled** — global flag needed for §7.2 delete-active flow |

---

*Last updated: 2026-06-07 — aligned with `multi-account-spec (1).docx`*
