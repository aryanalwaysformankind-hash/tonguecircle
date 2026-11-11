# TongueCircle Messaging Upgrade Patch

This is a **partial patch**, not a replacement project. Copy the included files into the matching paths in your existing repository, preserving the folder structure.

## Included upgrades
- Online presence heartbeat and conversation-partner-only online/last-seen lookup.
- Live translation and Latin-script pronunciation preview while composing (user-controlled toggle; off by default to avoid unexpected API usage).
- Voice-note transcription through the configured OpenAI API.
- Removes the 30-second recording timer. Voice notes are still limited to 10 MB per upload because this version stores audio in MongoDB documents.
- Shows sent/read state for messages using the existing read-receipt field.

## Backend configuration
- `OPENAI_API_KEY` is required for translation, transliteration, and transcription.
- Optional `OPENAI_TRANSCRIPTION_MODEL` (defaults to `whisper-1`).
- MongoDB must be configured as before. A `presence` collection/index is created by the existing startup index routine.

## Important limits / production notes
- Voice notes have no app-imposed duration timer, but **they are not literally unlimited**: uploads are capped at 10 MB, and MongoDB documents have a 16 MB maximum. For larger/unlimited-duration media, migrate audio storage to object storage (e.g. S3/R2) and save URLs/metadata in MongoDB.
- Live preview makes two model requests after the user pauses typing: one translation and one romanization. It is off by default; the user must turn it on in the composer.
- Presence is refreshed while the Messages page is open. A global app-level heartbeat is preferable if you want online status to remain accurate on every page.
- Existing voice/video call signalling and media UI are not replaced by this patch. Production calls may still require a TURN server; configure `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` in the frontend environment.

## Validation
- Python backend files passed `py_compile`.
- Full pytest suite could not run in this environment because `pytest-xdist` is missing.
- Frontend build/typecheck could not be run because `frontend/node_modules` is not present. Run the repository's `yarn typecheck` and `yarn build` after applying the patch.
