// Metro configuration for Expo
// - Prefer "main" over "module" to avoid react-native-svg web resolution issues.
// - Keep defaults otherwise.
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ["react-native", "browser", "main"];

module.exports = config;

