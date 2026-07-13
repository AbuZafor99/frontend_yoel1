# Zentrofix web frontend

Responsive React/TypeScript web client for the existing Zentrofix backend.

The frontend supports both homeowner and tradesperson workflows, including job discovery, offers, awarded-job progress, protected contact details, messaging, payments, maps and reviews. It uses the existing backend API without requiring backend source changes.

## Run locally

```bash
npm install
npm run dev
```

The default API is `https://api.zentrofix.com/api/v1`. For local backend work, create `.env.local` from `.env.example` and point it at `http://localhost:5000/api/v1`.

```bash
cp .env.example .env.local
```

Environment variables:

- `VITE_API_BASE_URL` — existing Zentrofix API base URL.
- `VITE_STRIPE_PUBLISHABLE_KEY` — public Stripe browser key for awarded-job activation.
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth web client ID used by Google Identity Services.

For Google sign-in, add the deployed website domain and local development URL to the OAuth client's authorized JavaScript origins in Google Cloud Console.

## Interaction notes

- The tradesperson “Jobs Near You” rail supports touch swiping, trackpad gestures, mouse-wheel horizontal scrolling and arrow controls without a visible scrollbar.
- Route changes use short app-style transitions and respect reduced-motion preferences.
- API and unexpected interface errors are handled through global snackbars and a recovery boundary.
- Loading states use the Zentrofix app logo animation.
- Job and profile location fields open the map picker. Search, browser location and map movement produce the address plus coordinates expected by the existing backend.

## Build

```bash
npm run build
```

See [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) for the screen map, two role flows, backend endpoint mapping, and implementation notes.
