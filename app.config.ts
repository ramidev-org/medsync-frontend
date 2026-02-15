// app.config.ts
// Loads .env and exposes EXPO_PUBLIC_* flags in expo.extra so they work on Web/Native.

import "dotenv/config";

export default ({ config }: any) => {
  const demo = process.env.EXPO_PUBLIC_DEMO;
  const role = process.env.EXPO_PUBLIC_ROLE;
  const speciality = process.env.EXPO_PUBLIC_SPECIALITY;

  return {
    ...config,
    userInterfaceStyle: "light",
    extra: {
      ...(config.extra || {}),
      EXPO_PUBLIC_DEMO: demo,
      EXPO_PUBLIC_ROLE: role,
      EXPO_PUBLIC_SPECIALITY: speciality,
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
