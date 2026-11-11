# Tongue Circle

Tongue Circle is a language-exchange community where people discover language partners, build profiles, chat privately, translate messages, and save useful phrases for practice.

## Features

- Clerk authentication (enable Google or other providers in the Clerk dashboard)
- Language-focused profiles with photos, bio, location, and known/learning languages
- Learner discovery with search, language filters, and compatibility scoring
- Private one-to-one conversations with unread counts, read tracking, and typing indicators
- On-demand streaming translation for profiles and messages using the OpenAI API
- Saved phrases with list and practice modes
- Responsive desktop and mobile navigation with unread-message counts

## Technology

- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query
- Backend: Python, FastAPI, Pydantic v2
- Database: MongoDB via Motor
- Authentication: Clerk
- Translation: OpenAI Chat Completions streaming API

## Repository layout

```text
tongue-circle-main/
  backend/
    lib/                 MongoDB connection and indexes
    models/              Pydantic request/response models
    routers/              Social and translation API routes
    tests/                Backend model tests
    server.py             FastAPI application
    .env.example          Backend environment template
  frontend/
    src/components/       Shared UI, auth, flags, layout, practice
    src/pages/            Landing, auth, discover, profile, messages, phrases
    src/lib/              API client, language data, types, helpers
    .env.example          Frontend environment template
  tests/                  Playwright configuration
  memory/SPEC.md           Product behavior and data model notes
```

## Requirements

- Node.js 22.12 or newer (recommended for the Vite version in this project)
- Python 3.11 or newer
- MongoDB Atlas or another reachable MongoDB deployment
- A Clerk application
- An OpenAI API key for translation

## Local development

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
python -m venv .venv
```

Activate the virtual environment, then install dependencies:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements-dev.txt
```

Edit `backend/.env` and set:

| Variable | Purpose |
|---|---|
| `MONGO_URL` | MongoDB connection string |
| `DB_NAME` | Database name, e.g. `tongue_circle` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key; keep private |
| `CLERK_ISSUER` / `CLERK_AUDIENCE` | Optional extra JWT validation; leave blank unless set up in Clerk |
| `CORS_ORIGINS` | Comma-separated exact frontend origins |
| `OPENAI_API_KEY` | OpenAI key for streamed translation |
| `OPENAI_MODEL` | Optional model name; defaults to `gpt-4o-mini` |
| `CLERK_PROXY_URL` | Optional Clerk proxy path; leave blank for normal separate frontend/backend hosting |

In the Clerk dashboard, enable the sign-in providers you want to offer (Google can be enabled there) and add your local and production application URLs to the allowed origins/configuration.

Start the API:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

The API is available at `http://localhost:8001/api`. The database readiness endpoint is `http://localhost:8001/api/health`.

### 2. Configure the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env
corepack yarn install
corepack yarn dev
```

Open `http://localhost:3000`. By default, Vite proxies `/api` requests to `http://127.0.0.1:8001`.

For local development, keep:

```env
VITE_API_URL=/api
```

### 3. Run backend tests and frontend checks

```bash
# Backend model and translation configuration tests
cd backend
pytest

# Frontend checks
cd ../frontend
corepack yarn typecheck
corepack yarn lint
corepack yarn build
```

## Production deployment

The frontend and backend can be deployed separately.

### Backend service

- Set the service root directory to `backend`.
- Set the backend environment variables listed above in your hosting provider.
- Install runtime dependencies with `pip install -r requirements.txt`.
- Set `CORS_ORIGINS` to the exact deployed frontend origin, for example `https://tonguecircle.example` (no trailing slash; use a comma-separated list for multiple origins).
- Use a persistent MongoDB database and a strong database user/password.
- Start command:

```bash
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
```

- Configure the host's health check to request `/api/health`.

### Frontend static site

- Set the site root directory to `frontend`.
- Set `VITE_API_URL` to the deployed backend API base, including `/api`, for example `https://tongue-circle-api.example.com/api`.
- Build command: `corepack yarn install && corepack yarn build`.
- Publish directory: `dist`.
- Configure the static host to rewrite application routes to `index.html` so paths such as `/messages` and `/people/:userId` work on refresh.

### Secrets and data

- Never commit `.env` files or real API keys. Only `.env.example` files belong in Git.
- Keep Clerk secret keys and the OpenAI key on the backend only.
- The browser receives only the Clerk publishable key.
- Profile photos are currently stored as base64 data in MongoDB. This is acceptable for an early MVP but should be moved to object storage before substantial growth.
- Translation requests consume the configured OpenAI account's API usage and may incur charges.

## API overview

All API routes are under `/api`:

- `GET /health/live` — process liveness check
- `GET /health` — MongoDB readiness check
- `GET /clerk/config` — public Clerk frontend configuration
- `GET|PUT /profile/me` — read/update the signed-in member's profile
- `GET /profiles` and `GET /profiles/{user_id}` — discover and view members
- `GET /conversations` — list conversations and unread counts
- `GET /conversations/{id}/messages` — read a conversation (marks incoming messages as read)
- `POST /messages` — send a message or start a conversation
- `GET /messages/unread-count` — unread message total
- `POST|GET /conversations/{id}/typing` — typing status
- `POST /translate` — authenticated streaming translation
- `GET|POST /phrases` and `DELETE /phrases/{id}` — saved phrase management
- `POST /location/resolve` — convert user-approved coordinates to approximate city/country

All social, messaging, location, phrase, and translation endpoints require a valid Clerk session. Conversation access is restricted to its two participants; phrase records are owner-scoped.

## Native mobile app (Android + iOS)

A React Native + Expo app has been added in `mobile/`. It reuses this FastAPI backend. See [`mobile/README.md`](mobile/README.md) for environment setup and run instructions. The mobile client is an MVP; see its README for features that still require implementation before store release.
