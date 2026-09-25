// EAS Update's manifest schema rejects pathAdvancedPattern, so these app links
// can't live in app.json's expo.android.intentFilters and are written straight
// into AndroidManifest.xml here instead
const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

const { getMainActivityOrThrow } = AndroidConfig.Manifest;
const renderIntentFilters = AndroidConfig.IntentFilters.default;

const HOST = "mirlo.space";

// Same shape expo.android.intentFilters took, so Expo's renderer below emits
// the XML prebuild used to emit for it
const APP_LINKS_INTENT_FILTER = {
  action: "VIEW",
  autoVerify: true,
  data: [
    { scheme: "https", host: HOST, path: "/" },
    { scheme: "https", host: HOST, pathAdvancedPattern: "/[^/]+" },
    { scheme: "https", host: HOST, pathAdvancedPattern: "/[^/]+/releases" },
    {
      scheme: "https",
      host: HOST,
      pathAdvancedPattern: "/[^/]+/release/[^/]+",
    },
    {
      scheme: "https",
      host: HOST,
      pathAdvancedPattern: "/[^/]+/release/[^/]+/tracks/[0-9]+",
    },
  ],
  category: ["BROWSABLE", "DEFAULT"],
};

function withMirloAppLinks(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addAppLinksIntentFilter(config.modResults);
    return config;
  });
}

function addAppLinksIntentFilter(androidManifest) {
  const mainActivity = getMainActivityOrThrow(androidManifest);
  const [intentFilter] = renderIntentFilters([APP_LINKS_INTENT_FILTER]);

  // Expo marks the filters it generates from app config and deletes every
  // marked one on each prebuild, so ours has to stay unmarked to survive
  delete intentFilter.$["data-generated"];

  // Prebuild can run over a manifest that already carries ours, so replace it
  // rather than appending a duplicate
  const others = (mainActivity["intent-filter"] ?? []).filter(
    (filter) => !isAppLinksIntentFilter(filter),
  );
  mainActivity["intent-filter"] = [...others, intentFilter];

  return androidManifest;
}

function isAppLinksIntentFilter(intentFilter) {
  return Boolean(
    intentFilter.data?.some((data) => data.$?.["android:host"] === HOST),
  );
}

module.exports = withMirloAppLinks;
