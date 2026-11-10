# TongueCircle launch upgrade

This overlay adds: one-to-one WebRTC audio/video call signalling, voice-message recording/playback, a wider language catalogue (100+ catalogue entries), launch-page feature updates, and UI polish.

## Deployment notes
- Keep the existing Clerk, MongoDB, CORS and API environment variables unchanged.
- WebRTC currently uses public STUN servers. For reliable calls across restrictive NAT/firewall networks, configure a TURN relay with frontend environment variables `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL` (use short-lived browser credentials supplied by your TURN provider; do not expose permanent account credentials or commit them).
- Voice messages are stored as audio data URLs in MongoDB documents. The API caps each recording payload; the client limits recordings to 30 seconds. For a larger production community, move audio to object storage and keep only a secure media URL in MongoDB.
- The language list is an expanded catalogue, not a claim that every language has complete translation, transcription or speech synthesis coverage. Provider coverage varies.
- Premium checkout is not activated; the Plans page labels Premium as coming soon.

## Apply
Extract this patch into the existing repository root and allow files to merge/overwrite. It contains no deletion instructions. Then commit and push; Render should build from the updated repository.
