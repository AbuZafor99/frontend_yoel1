# Zentrofix web frontend analysis

This frontend mirrors the existing `flutter_youl` client and uses the existing `backend_yoel2121` API. It is intentionally a web-first implementation: full-screen mobile flows that are short or form-based become dialogs on desktop, while detail-heavy experiences remain pages.

## Product roles and flows

### Shared / guest flow

1. Landing page (`OnboardingScreen1` / `GuestHomeScreen` concept): browse service categories and public pending jobs.
2. Auth entry: sign in, create account, choose role, verify email OTP, forgot password, reset password.
3. Guest actions that require identity—apply, message, create a job, see private contact data—send the visitor to auth.

### Homeowner (`homeowner` and legacy `user` roles)

1. Dashboard: home content, carousel area, current job summary and location-aware actions.
2. Post job: title, description, category, budget, location and optional files. On web this is a modal (`PostJobModal`) instead of a separate mobile screen.
3. My jobs: filter by pending, active/in-progress and completed.
4. Job details: inspect the request, review applicants, accept/decline an application, message the assigned tradesperson, update/cancel status and review completed work.
5. Chat, notifications, profile, password/settings and account management.

### Tradesperson

1. Dashboard / jobs near you: location-aware open work and matching services.
2. Job detail: inspect the homeowner request, send an application with quote, start date and message. On web this is an application modal.
3. Current work: active applications and progress stages 1–3.
4. Profile: trade/service area, bio, ratings, identity/KYC state.
5. Chat, notifications, recent work and reviews.

## Backend contract used by this frontend

All endpoints are relative to `VITE_API_BASE_URL` (default: `https://api.zentrofix.com/api/v1`). The API client unwraps the backend `{ success, message, data, meta }` response envelope and attaches the stored bearer access token.

| Area | Endpoints used |
| --- | --- |
| Auth | `POST /auth/login`, `/register`, `/verify`, `/resend-otp`, `/forget`, `/reset-password` |
| Public discovery | `GET /carousels`, `/categories`, `/jobs/public` |
| Homeowner jobs | `GET /jobs/me/user`, `POST /jobs`, `GET /jobs/:id`, `GET /jobs/:id/applicants`, `PATCH /applications/:id/decision`, `PATCH /jobs/:id/status` |
| Tradesperson jobs | `GET /jobs/near-you`, `/jobs/current-jobs`, `/applications/me`, `POST /applications/jobs/:jobId/apply`, `PATCH /jobs/:id/progress` |
| Account | `GET /users`, `PUT /users/update-profile` |
| Conversations | `GET /conversations/me`, `POST /conversations`, `GET/POST /messages/:conversationId` |
| Notifications | `GET /notifications`, `PATCH /notifications/read-all` |
| Reviews | `POST /reviews/jobs/:jobId` (contract-ready in `api`, UI can be added to completed detail state) |

The backend also exposes Socket.IO rooms (`chat_<userId>`, `user_<userId>`, `conv_<conversationId>`). The first web slice uses REST polling-on-navigation for simpler deployment; realtime subscriptions can be added without changing page contracts.

## Architecture

* React + TypeScript + Vite for a lightweight deployable web client.
* Feature pages under `src/pages`, shared UI under `src/components`, API contracts under `src/api`, and role/session state under `src/context`.
* `AuthContext` persists the access token and rehydrates the user through `GET /users`.
* Route protection is role-aware at the workspace level; both `homeowner` and legacy `user` map to the homeowner experience.
* `FormData` is used for job/application writes to remain compatible with the backend's Multer middleware.
* Theme tokens follow the app constants: `#B1DFFF → #EEF8FF` light gradient, `#004B62` text/navigation, `#A855F7` auth/action purple, `#FFC107` warm accent, `#1A1A1A` auth surface, and rounded light cards.

## Known backend integration notes

* Job creation requires a GeoJSON location in the model. The web modal asks for a location and offers browser geolocation; users should allow location when the backend expects `lat`/`lng`.
* The KYC backend returns a Didit session URL, but the web UI currently presents a clear handoff notice because the mobile flow uses a native WebView. A dedicated external verification page can be wired once the desired web redirect policy is confirmed.
* Stripe payment initiation/confirmation is present in the API client contract but intentionally not faked in the first UI slice; payment requires a browser Stripe Elements flow and publishable-key configuration.
* The backend's public CORS list should include the deployed frontend origin and local Vite origins.
