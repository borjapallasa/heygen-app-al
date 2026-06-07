# Phase 5 — QA Results

**Date:** 2026-06-07  
**Org UUID tested:** `5ec92adf-57cb-4d08-817a-f523cc308cda`

---

## Automated / API tests

| Test | Result | Evidence |
|------|--------|----------|
| **T10** `yarn build` | ✅ Pass | Clean production build |
| GET `/api/credentials` returns array | ✅ Pass | `{ exists, credentials[] }` |
| POST `/api/organizations` | ✅ Pass | 200 sync |
| POST `/api/credentials/decrypt` + `credential_uuid` | ✅ Pass | Returns `api_key` |
| POST `/api/credentials/decrypt` without uuid | ✅ Pass | Single-account backward compat |
| GET `/` | ✅ Pass | 200 after dev restart |

---

## Scenario tests

| Test | Result | Notes |
|------|--------|-------|
| **T1** — 0 credentials at init | ⏸ Manual | Requires empty DB; not run (destructive) |
| **T2** — 1 credential at init | ✅ Pass | DB has 1 row; auto-decrypt, no picker (session logs + API) |
| **T3** — 2+ credentials at init | ⏸ Manual | Local DB has `UNIQUE(org, provider)` — only 1 row; test on client staging with 2+ keys |
| **T4** — Settings: add account | ⏸ Manual | UI implemented; verify with 2nd HeyGen API key |
| **T5** — Settings: switch account | ⏸ Manual | Needs 2+ accounts in DB |
| **T6** — Settings: delete non-active | ⏸ Manual | Needs 2+ accounts in DB |
| **T7** — Settings: delete active | ⏸ Manual | Needs 2+ accounts in DB |
| **T8** — Single-account regression | ✅ Pass | Same as T2 |
| **T9** — Iframe parent | ✅ Pass | `iframe/index.html` READY → INIT; org sync 200 in dev logs |

---

## Dev environment notes

1. **Do not run `yarn build` while `yarn dev` is active** — causes `.next` cache corruption (`e[o] is not a function`). Fix: `rm -rf .next && yarn dev`.
2. **Multi-account locally** — repo schema may block 2nd credential insert; client production DB is expected to allow multiple rows (spec: no schema changes in PR).

---

## Extra changes (outside spec §8)

| File | Change |
|------|--------|
| `src/components/ApiKeyModal.tsx` | Optional `onCancel` + close button (user request) |
| `tsconfig.json` | `ignoreDeprecations: "6.0"` for TS 6.0 build |

---

## Recommended manual checklist before PR

- [ ] Add second HeyGen API key via Settings → Add account
- [ ] Reload iframe — account picker appears when 2+ keys exist
- [ ] Switch active account — avatars refresh
- [ ] Delete non-active account
- [ ] Delete active account — picker reappears

---

*Phase 6: Create PR against `main` using summary in `docs/PR_DESCRIPTION.md`*
