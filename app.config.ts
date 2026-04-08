// app.config.ts
// Loads .env and exposes EXPO_PUBLIC_* flags in expo.extra so they work on Web/Native.

import "dotenv/config";

export default ({ config }: any) => {
  const demo = process.env.EXPO_PUBLIC_DEMO;
  const role = process.env.EXPO_PUBLIC_ROLE;
  const speciality = process.env.EXPO_PUBLIC_SPECIALITY;
  const clinicAdmin = process.env.EXPO_PUBLIC_CLINIC_ADMIN;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  return {
    ...config,
    userInterfaceStyle: "light",
    extra: {
      ...(config.extra || {}),
      EXPO_PUBLIC_DEMO: demo,
      EXPO_PUBLIC_ROLE: role,
      EXPO_PUBLIC_SPECIALITY: speciality,
      EXPO_PUBLIC_CLINIC_ADMIN: clinicAdmin,
      EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
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
