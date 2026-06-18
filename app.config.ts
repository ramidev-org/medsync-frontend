// app.config.ts
// Expo CLI already loads .env before evaluating this file, so we can read
// EXPO_PUBLIC_* directly from process.env without importing dotenv here.

export default ({ config }: any) => {
  const role = process.env.EXPO_PUBLIC_ROLE;
  const speciality = process.env.EXPO_PUBLIC_SPECIALITY;
  const clinicAdmin = process.env.EXPO_PUBLIC_CLINIC_ADMIN;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const livekitUrl = process.env.EXPO_PUBLIC_LIVEKIT_URL;
  const livekitTokenEndpoint = process.env.EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT;

  return {
    ...config,
    userInterfaceStyle: "light",
    extra: {
      ...(config.extra || {}),
      EXPO_PUBLIC_ROLE: role,
      EXPO_PUBLIC_SPECIALITY: speciality,
      EXPO_PUBLIC_CLINIC_ADMIN: clinicAdmin,
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
      EXPO_PUBLIC_LIVEKIT_URL: livekitUrl,
      EXPO_PUBLIC_LIVEKIT_TOKEN_ENDPOINT: livekitTokenEndpoint,
    },
    plugins: (config.plugins || []).map((p: any) => {
      // remove dark splash override (light-only app)
      if (Array.isArray(p) && p[0] === "expo-splash-screen") {
        return [
          "expo-splash-screen",
          {
            ...(p[1] || {}),
            dark: undefined,
          },
        ];
      }
      return p;
    }),
  };
};
