# TongueCircle Mobile (Expo)

This is the new Android + iOS app frontend. It reuses the existing FastAPI + MongoDB API; it does not replace the web frontend.

## Requirements
- Node.js 20.19+ (Expo SDK 53) and npm
- Expo Go on a phone, or Android Studio / Xcode for native builds
- Existing TongueCircle backend deployed with Clerk and MongoDB configured

## Setup
```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend URL including /api
# Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to the Clerk publishable key
npm install
npx expo start
```
Scan the QR code using Expo Go. For device builds use `npx expo run:android` or `npx expo run:ios` (iOS native build requires macOS).

## Clerk setup
Use the same Clerk application as the website. Configure email/password sign-in and email verification. Add the app's custom scheme `tonguecircle` to the Clerk redirect/origin settings if required by your Clerk dashboard. Keep the Clerk secret key and OpenAI key only on the backend; never add them to `EXPO_PUBLIC_*` variables.

## Backend compatibility
The app calls the existing authenticated endpoints: `/profile/me`, `/profiles`, `/profiles/{id}/follow`, `/conversations`, `/conversations/{id}/messages`, `/messages`, and `/translate`.

The profile API requires `display_name`, `main_photo`, and at least one `known_languages` item with exactly one `native` level. The onboarding form sends those fields and the existing optional birth date and sex fields.

## Current MVP scope
Included: Clerk sign-in/sign-up entry, profile onboarding, home, discover, follow, conversations list, one-to-one text chat, translation, profile summary, community group/room metadata creation and joining, and bottom-tab navigation.

Not yet implemented: email verification code entry UI, push notifications, photo upload/camera, audio recording/playback, AI grammar correction endpoint, group chat messaging, and live WebRTC audio/video. The existing backend's meeting-room endpoints only create/list/join room records; they are not a live media server. These should be built as separate milestones rather than represented as complete.
