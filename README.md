# Zentrofix web frontend

Responsive React/TypeScript web client for the existing Zentrofix backend.

## Run locally

```bash
npm install
npm run dev
```

The default API is `https://api.zentrofix.com/api/v1`. For local backend work, create `.env.local` from `.env.example` and point it at `http://localhost:5000/api/v1`.

## Build

```bash
npm run build
```

See [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) for the screen map, two role flows, backend endpoint mapping, and implementation notes.
