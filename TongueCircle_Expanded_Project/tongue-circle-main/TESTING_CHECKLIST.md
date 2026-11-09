# Tongue Circle release testing checklist

The repository includes a backend model/translation unit test suite. A complete release still requires a configured Clerk app, MongoDB database, OpenAI API key, and browser testing against a running API.

## Automated checks

From `backend/`:

```bash
python -m pip install -r requirements-dev.txt
pytest
```

From `frontend/`:

```bash
corepack yarn install
corepack yarn typecheck
corepack yarn lint
corepack yarn build
```

## Manual end-to-end checks

- [ ] Sign up with email and verify the account.
- [ ] Sign in, refresh the page, and sign out.
- [ ] Confirm a signed-out visitor cannot access protected data.
- [ ] Create a profile with a main photo, bio, city, native language, and learning languages.
- [ ] Edit the profile and confirm changes persist after refresh.
- [ ] Discover another account and verify language-match ranking and filters.
- [ ] Open another person's profile and start a conversation.
- [ ] Send messages in both directions; verify refresh, read state, unread badges, and typing indicator.
- [ ] Translate a profile bio and a chat message; verify provider errors are shown safely.
- [ ] Save a translated phrase, practise it, and delete it.
- [ ] Test mobile navigation and layouts at narrow phone widths.
- [ ] Verify profile photos and messages are not exposed to another signed-in account.
- [ ] Check browser console and backend logs for errors.

## Required production configuration

- [ ] MongoDB Atlas database and restricted database user.
- [ ] Clerk production application, allowed origins, publishable key, and secret key.
- [ ] OpenAI API key with billing/usage limits configured.
- [ ] Exact production frontend origin in `CORS_ORIGINS`.
- [ ] Production `VITE_API_URL` pointing to the backend `/api` base.
- [ ] Static-host SPA rewrite to `/index.html`.
- [ ] HTTPS enabled for both frontend and backend.
- [ ] Secrets entered in the hosting provider dashboard, never committed to Git.

Do not mark the application production-ready until every manual check above has been completed in the deployed environment.
