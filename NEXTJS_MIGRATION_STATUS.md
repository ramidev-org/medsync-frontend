# Next.js Migration Status

## Current state

- The existing Expo Router app remains the source of truth for the production workflow.
- A new parallel Next.js app now exists in `apps/web`.
- The Next.js app already preserves the current dashboard direction:
  - same primary blue and light surface palette
  - left sidebar clinic shell
  - top header card pattern
  - dashboard metrics and desktop table layout

## Commands

- `npm run web`
  - Starts the current Expo web app
- `npm run web:next:dev`
  - Starts the new Next.js app
- `npm run web:next:build`
  - Builds the new Next.js app
- `npm run web:next:lint`
  - Lints the new Next.js app

## Recommended migration order

1. Port Supabase auth into `apps/web`
2. Port dashboard data fetching and role redirects
3. Port `patients`, `visits`, and `consultations`
4. Implement prescription print and PDF flows
5. Port specialty workspaces with web-native interaction models
6. Move landing/SEO pages fully into Next.js

## Important note

This is intentionally a parallel migration, not an in-place replacement. That keeps the
current Expo product working while the Next.js dashboard reaches feature parity.
