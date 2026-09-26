# Project Guidance

## User Preferences

- Mobile-first responsive layout
- Zero runtime cost: no external AI APIs, LLMs, or paid third-party services
- Deterministic logic, native HTML5 APIs, and direct URL parameters only
- Public storefront must have zero auth wall
- Lucide React icons for UI iconography

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- This project uses the enhanced migration chain (migrations/ + [canisters.backend.migrations]); the check-stable baseline .old/src/backend/dist/backend.most is an empty scaffold (actor {}), so the gate treats every migration file as pending. Keep exactly one migration file and fold state-shape changes into it.
- Motoko has no triple-quoted string literals; build multi-line Text from single-quoted literals joined with # and \n escapes.
- Iterator dot methods (.find/.filter/.toArray/.foldLeft) and array .values()/.map require the owning module imported top-level (mo:core/Iter, mo:core/Array); Int.toText needs mo:core/Int.
- OQL 0.6.2: MapEntity.toEntityManual<K,V> infers K,V from the Map receiver — do not pass explicit type arguments.
- TanStack Router validateSearch must annotate optional keys ({ q?: string; category?: string }) or every Link to that route is forced to pass them.
- biome useSemanticElements rejects role='status'/'dialog' on divs; use <output> for status banners and <dialog open> for modals.
- useInternetIdentity exposes isAuthenticated (covers restored sessions) — use it, not isLoginSuccess, to gate authenticated UI.
- After changing backend types, run pnpm bindgen from the repo root (not src/frontend) so frontend bindings pick up new fields.
- Store link QR codes can be rendered with a self-contained byte-mode QR encoder on canvas — no npm package or network call needed.
- Local preflight found /admin and /dashboard render a raw error boundary instead of redirecting to sign-in when signed out, and /admin crashes for signed-in identities — investigate the RequireAuth gate and admin route rendering.
- TanStack Router redirect() thrown during render surfaces as the raw error boundary in this app; redirect from a component gate with useNavigate() inside useEffect and render a loading state while the redirect is pending.
- Generated bindings type owner_id as Principal, but values reaching components can be plain strings; resolve identity through a helper that checks typeof === 'string' before calling .toText().
- The autonomous browser blocks off-origin navigation, so a wa.me deep-link can only be verified up to the constructed URL; assert the built link rather than the external page.
