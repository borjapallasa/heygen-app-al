## Summary

Adds multi-HeyGen account support to the iframe child app:

- **Init flow:** When an org has 2+ stored credentials, users pick an account before the app loads; 0 → ApiKeyModal, 1 → auto-decrypt (unchanged).
- **API:** `GET /api/credentials` returns all credentials; decrypt/DELETE accept optional `credential_uuid`; POST inserts new credential rows.
- **Settings:** Gear icon on Avatars header opens account management (add / delete / switch).

No parent app, postMessage, or schema changes.

## Files changed

- `src/state/AppStateProvider.tsx`
- `app/api/credentials/route.ts`
- `app/api/credentials/decrypt/route.ts`
- `src/components/HeyGenAccountPickerModal.tsx` (new)
- `src/components/AppInitializer.tsx`
- `src/features/settings/AccountSettingsScreen.tsx` (new)
- `src/components/AvatarGroupBubbles.jsx`

Also: `tsconfig.json` (build fix), `ApiKeyModal.tsx` (optional close for Add account).

## Test plan

- [x] `yarn build` passes
- [x] GET credentials returns array; decrypt with/without `credential_uuid`
- [x] 1 credential: auto-decrypt, no picker
- [x] Iframe test parent: READY → INIT → app loads
- [ ] 2+ credentials: picker at init (verify on staging DB with multiple keys)
- [ ] Settings: add / switch / delete accounts

## Backward compatibility

| Scenario | Behavior |
|----------|----------|
| 0 credentials | ApiKeyModal (unchanged) |
| 1 credential | Auto-decrypt, no picker (unchanged) |
| 2+ credentials | Picker shown |
