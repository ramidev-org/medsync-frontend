# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Local testing (Web)

Start:

```bash
npm run web
```

Demo mode (no backend):
- `/?demo=true&role=doctor`
- `/?demo=true&role=assistant`
- Clinic admin demo doctor: `/?demo=true&role=doctor&clinic_admin=true`

Real mode (Supabase):
1) Set env vars in `.env`:
   - `EXPO_PUBLIC_DEMO=false`
   - `EXPO_PUBLIC_SUPABASE_URL=...`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`
   - `CALL_STUN_URLS=stun:stun.l.google.com:19302`
   - Optional TURN fallback:
   - `CALL_TURN_URL=turn:your-turn-host:3478`
   - `CALL_TURN_USERNAME=...`
   - `CALL_TURN_CREDENTIAL=...`
2) Run SQL in Supabase:
   - `database/sql/000_all_changes.sql`

## Desktop offline mode

The browser version is intentionally online-only. Offline storage is enabled only
when the app is launched through the Electron desktop shell.

Development:

1. Start the Expo web server with `npm run web`.
2. In a second terminal, run `npm run desktop:dev`.

Production installer:

```bash
npm run desktop:package
```

The desktop shell stores encrypted offline queue/cache files in the operating
system's application data directory when Electron's OS encryption is available.
The consultation workflow is the first offline-enabled workflow: open a
consultation once while online, then drafts and closures can be saved during an
outage and replayed automatically when connectivity returns. Chat, calls,
analytics, billing, and other workflows remain online-only for now.

Supabase WebRTC calls:
- Presence channel: `clinic:{clinic_id}:presence`
- Incoming call channel: `clinic:{clinic_id}:user:{receiver_id}`
- Offer / answer / ICE / end channel: `call:{call_session_id}`
- WebRTC offer, answer, and ICE candidates are exchanged with Supabase Broadcast.
- For local web testing, start the call config server in a second terminal:

```bash
npm run call:server
```

- For hosted deployments, the repo includes `api/call-config.ts` for a server-side call config endpoint.
- Restart Expo web after changing any `CALL_*` or `EXPO_PUBLIC_CALL_CONFIG_ENDPOINT` values.

Onboarding:
- Clinic activation: `/activate-clinic?token=...`
- Staff invite acceptance: `/accept-invite?token=...`

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
