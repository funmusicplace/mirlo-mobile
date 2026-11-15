import appJson from "../app.json";

it("keeps android.versionCode, which F-Droid reads, in step with the version", () => {
  const [major, minor, patch] = appJson.expo.version.split(".").map(Number);

  expect(appJson.expo.android.versionCode).toBe(
    major * 10000 + minor * 100 + patch,
  );
});
