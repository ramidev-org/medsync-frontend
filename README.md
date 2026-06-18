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
   - `EXPO_PUBLIC_LIVEKIT_URL=wss://your-livekit-host`
   - `EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT=http://127.0.0.1:3001/api/livekit-token`
   - `LIVEKIT_URL=wss://your-livekit-host`
   - `LIVEKIT_API_KEY=...`
   - `LIVEKIT_API_SECRET=...`
2) Run SQL in Supabase:
   - `database/sql/000_all_changes.sql`

LiveKit calls:
- The chat call buttons now open a custom in-app LiveKit call surface.
- Participant names are minted by the token server from the signed-in user, so the app does not let callers rename themselves.
- For local web testing, start the token endpoint in a second terminal:

```bash
npm run livekit:token-server
```

- For hosted deployments, the repo includes `api/livekit-token.ts` for a server-side token endpoint.
- Restart Expo web after changing any `EXPO_PUBLIC_LIVEKIT_*` values.

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
