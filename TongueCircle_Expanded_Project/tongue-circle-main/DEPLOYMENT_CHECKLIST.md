# Tongue Circle deployment

A Render Blueprint is provided in `render.yaml` as a starting point. You can also deploy the frontend and backend separately on another provider using the same settings.

## Before deployment

1. Create a MongoDB database and a database user limited to the application database.
2. Create a Clerk application. Add your local and production frontend URLs to Clerk's allowed origins and configure the sign-in methods you want to support.
3. Create an OpenAI API key. Keep it on the backend only and set an appropriate usage budget/alert.
4. Choose the production frontend domain and backend API domain.

## Backend environment

Set these in the backend hosting dashboard:

- `MONGO_URL`
- `DB_NAME=tongue_circle`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CORS_ORIGINS=https://YOUR-FRONTEND-DOMAIN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4o-mini` (or a model available to your API account)
- Optional `CLERK_ISSUER` and `CLERK_AUDIENCE` only when you know the exact values for your Clerk instance.

Install with `pip install -r requirements.txt` and start with:

```bash
uvicorn server:app --host 0.0.0.0 --port $PORT
```

Use `/api/health/live` for process liveness and `/api/health` for MongoDB readiness.

## Frontend environment

Set `VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`, then install and build:

```bash
corepack yarn install
corepack yarn build
```

Publish `frontend/dist` and configure a single-page-app rewrite from all paths to `/index.html`.

## Final checks

Run every item in `TESTING_CHECKLIST.md` against the deployed URLs. Do not use test Clerk keys or placeholder MongoDB/OpenAI values in production. The deployment manifest uses a sample backend URL; replace it with the actual backend service URL if your host assigns a different one.
