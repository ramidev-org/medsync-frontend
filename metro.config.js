// Metro configuration for Expo
// - Prefer "main" over "module" to avoid react-native-svg web resolution issues.
// - Keep defaults otherwise.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ["react-native", "browser", "main"];
config.resolver.blockList = [
  new RegExp(
    `${path
      .resolve(__dirname, "node_modules")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\\\/](?:\\.[^\\\\/]+-[^\\\\/]+)(?:[\\\\/].*)?$`,
  ),
];

module.exports = config;

