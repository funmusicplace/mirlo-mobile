// Standard Expo Metro config. `getDefaultConfig` from expo/metro-config
// wires up everything Expo expects:
//   - resolver plugins (so e.g. `expo-router/entry` resolves to entry.js)
//   - the hashAssetFiles plugin (required by expo-updates for embedded
//     asset checksums at build time)
//   - sensible source-extension and asset-extension defaults
//
// Without this file, `npx expo start` works (Expo's CLI builds Metro
// config in memory) but `eas build` fails during the
// `[CP-User] Generate updates resources for expo-updates` build phase
// because that script reads metro.config.js from disk
const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
