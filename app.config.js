// Dev client builds install as "Mirlo Dev" beside the store app, and only they
// claim exp+mirlo-mobile, the scheme PR preview QR codes open
const IS_DEV = process.env.APP_VARIANT === "development";
const suffix = IS_DEV ? ".dev" : "";

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? `${config.name} Dev` : config.name,
  ios: {
    ...config.ios,
    bundleIdentifier: config.ios.bundleIdentifier + suffix,
  },
  android: { ...config.android, package: config.android.package + suffix },
  plugins: [
    ...config.plugins,
    ["expo-dev-client", { addGeneratedScheme: IS_DEV }],
  ],
});
