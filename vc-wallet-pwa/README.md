# Verifiable Credential Wallet PWA — UIDAI Sandbox Assignment

React + Vite implementation of the Frontend Developer assignment.

## Setup

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build (also builds the PWA assets)
npm test         # run the Jest + React Testing Library suite
```

## Project structure

```
src/
  api/mockApi.js                 mock GET /api/credentials (latency + failure simulation)
  context/CredentialsContext.jsx Context API + useReducer state management
  components/LoginScreen.jsx     mock login gate (any non-empty credentials work)
  components/Dashboard.jsx       loading / error / empty / success states
  components/CredentialCard.jsx  single credential list item
  components/SecureDataMask.jsx  Part 2 — the reveal/re-mask component
  components/__tests__/          Part 3 — Jest + RTL test suite
public/
  service-worker.js              Part 3 — offline caching for the credentials API
  manifest.json                  PWA manifest
```

### Login

The assignment scenario mentions a test user logging in before viewing
credentials. `LoginScreen.jsx` is a minimal mock gate (no real backend —
any non-empty username/password works, e.g. `test` / `test`) that sits in
front of `<CredentialsProvider>` in `App.jsx`, so the end-to-end flow
matches the scenario description. This is outside the three graded coding
parts but included for completeness.

## How each part is addressed

**Part 1 — Dashboard & state management**
`CredentialsContext` uses `useReducer` (not just `useState`) to model the
fetch lifecycle as explicit actions (`FETCH_START` / `FETCH_SUCCESS` /
`FETCH_ERROR`), exposed via a custom `useCredentials()` hook. `Dashboard.jsx`
branches on `isLoading` / `isError` / `isEmpty` to render each of the three
required UI states, with a retry action wired to the same `refetch` function.

**Part 2 — SecureDataMask**
- Masks all but the last 4 characters by default.
- `useRef` holds the timeout handle (not state, so it doesn't cause re-renders).
- `useCallback` for `reveal`/`hide`/`toggle` keeps the memoized component
  (`React.memo`) from re-rendering unnecessarily inside a mapped list.
- On reveal, a `setTimeout` re-masks after 10s and clears the timer ref;
  clicking "Hide" cancels the pending timer early.
- Accessibility: `aria-pressed` on the toggle button reflects state,
  `aria-label` describes the action in context ("Tap to reveal Aadhaar
  eKYC identifier"), the button is a native `<button>` (keyboard operable
  by default), and a visually-hidden `role="status" aria-live="polite"`
  region announces reveal/hide transitions to screen readers without
  moving focus.

**Part 3 — Offline + testing**
- `public/service-worker.js` intercepts `GET /api/credentials` with a
  network-first, cache-fallback strategy: successful responses are stored
  in both Cache Storage and IndexedDB; if the network fails, it serves the
  last cached response (falling back to IndexedDB if the Cache Storage
  entry is missing).
- `SecureDataMask.test.jsx` uses Jest fake timers + React Testing Library:
  mounts the component, simulates a click via `userEvent`, asserts the
  unmasked value is shown, advances timers by 10s inside `act()`, and
  asserts the value is masked again and the reveal button's
  `aria-pressed` state has reset. Additional tests cover keyboard
  navigation, early manual hide, and the live-region announcement.

## Notes / assumptions

- No backend exists; `mockApi.js` simulates the network with a configurable
  delay and can be toggled to simulate failure or an empty list via the
  `apiOptions` passed into `<CredentialsProvider>` in `App.jsx`.
- Kept to plain CSS (no UI framework) to keep the diff focused on the
  logic being evaluated.
