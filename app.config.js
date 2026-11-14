// Dev client builds install as "Mirlo Dev" beside the store app, and only they
// claim exp+mirlo-mobile, the scheme PR preview QR codes open
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_FDROID = process.env.APP_VARIANT === "fdroid";
const suffix = IS_DEV ? ".dev" : "";

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? `${config.name} Dev` : config.name,
  ios: {
    ...config.ios,
    bundleIdentifier: config.ios.bundleIdentifier + suffix,
  },
  android: { ...config.android, package: config.android.package + suffix },
  updates: IS_FDROID ? { ...config.updates, enabled: false } : config.updates,
  plugins: [
    ...config.plugins,
    ...(IS_FDROID ? [] : [["expo-dev-client", { addGeneratedScheme: IS_DEV }]]),
  ],
});
