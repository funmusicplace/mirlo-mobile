# Mirlo Mobile App

**Built with React Native & TypeScript**

***Currently Under Development**

This is the official mobile app for [Mirlo](https://mirlo.space) developed in collaboration with the Mirlo team. This app will allow users to listen to their purchased songs and the publicly available catalog of music. Check out [Mirlo's GitHub](https://github.com/funmusicplace/mirlo)!

The current focus is developing for iOS. Development for Android is on the roadmap.

## App Preview

This gif displays the most recent versions of the home, search, menu, album, and artist views:

<img src="https://github.com/rann143/mirlo-mobile/blob/main/assets/images/mirlo-app-preview-2.gif" alt="mirlo app preview" width="300" height="600"/>

## Get started

### Prerequisites

- Node.js **v20+** (the CI workflow and `eas-cli` 18.x both require ≥ 20)
- npm
- For iOS: Xcode 26+ (Expo SDK 55 / `expo-modules-core` uses Swift 6.2 syntax — Xcode 16 ships only Swift 6.1 and won't build) and [CocoaPods](https://guides.cocoapods.org/using/getting-started.html)
- For Android: [Android Studio](https://developer.android.com/studio) (or just the [command-line tools](https://formulae.brew.sh/cask/android-commandlinetools)) plus the API 35 system image, build-tools 35, and platform-tools

### Setup

1. Run API Locally

   Follow instructions in [mirlo's README](https://github.com/funmusicplace/mirlo/blob/main/README.md)

2. Set up env variables & install dependencies

   ```bash
   cp .env.example .env
   npm install
   ```

   `npm install` runs `patch-package` via the `postinstall` script — see [Patched dependencies (Android)](#patched-dependencies-android) below.

3. Build and run the native app

   For iOS:

   ```bash
   npx expo run:ios
   ```

   For Android (set `ANDROID_HOME` / `JAVA_HOME` and have an emulator running first — see [Android setup](#android-setup) below):

   ```bash
   npx expo run:android
   ```

4. Start Metro on its own (after the native build is installed)

   ```bash
   npx expo start
   ```

Follow Expo's guides to set up a development build for your iOS simulator:

- [Setting up the iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Create build for iOS Simulator](https://docs.expo.dev/build-reference/simulators/)

**Note:** This project contains native dependencies, so it cannot be run in Expo Go. You must build the native app first using the commands above.

### Android setup

Android Studio installs the IDE; the SDK and emulator are separate. The fastest macOS path is:

```bash
brew install --cask android-studio
brew install --cask android-commandlinetools

export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

# accept licenses, install SDK packages
yes | sdkmanager --licenses
sdkmanager "platform-tools" "emulator" \
  "platforms;android-35" "build-tools;35.0.0" \
  "system-images;android-35;google_apis_playstore;arm64-v8a"

# create + boot a Pixel 7 / API 35 AVD (one-time)
echo "no" | avdmanager create avd -n mirlo_test \
  -k 'system-images;android-35;google_apis_playstore;arm64-v8a' -d pixel_7
emulator -avd mirlo_test -no-snapshot &

# run the app — first build is ~10 min, incremental builds are ~10 sec
npx expo run:android
```

Persist the env block in your `~/.zshrc` (or `~/.bashrc`) so future shells pick it up automatically.

This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Patched dependencies (Android)

Two transitive dependencies need patches to build and run on Android with Expo SDK 55 / RN 0.83 / Gradle 9 / New Architecture. Patches live in [`patches/`](patches/) and are auto-applied on `npm install` via the `postinstall` hook (uses [`patch-package`](https://github.com/ds300/patch-package)). Each patch is small (the published `.patch` files are the source of truth — read them when in doubt).

### `react-native-track-player+4.1.2.patch`

Three issues, all in `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/`:

1. **`module/MusicModule.kt` — `originalItem!!` (×2).** Kotlin 2.1.20 (shipped with RN 0.83) enforces strict null-checks: `Arguments.fromBundle(Bundle)` no longer accepts `Bundle?`. Two call sites in `getTrack` and `getActiveTrack` needed the non-null assertion.
2. **`module/MusicModule.kt` — block-body conversion (37 methods).** RN 0.83 introduced `TurboModuleInteropUtils`, which inspects `@ReactMethod` JVM return types and rejects any module where a non-synchronous method returns non-`void`. Track-player's expression-body methods like `fun play(callback: Promise) = scope.launch { ... }` infer return type `kotlinx.coroutines.Job`, not `Unit`, and the parser throws `ParsingException: TurboModule system assumes returnType == void iff the method is synchronous` — which means **`TrackPlayerModule` won't load at all on Android**, cascading into "No QueryClient set", missing-default-export warnings, and a broken UI. The patch converts each method to a block body so the inferred return type is `Unit`.
3. **`service/MusicService.kt` — `reactHost` accessor.** Track-player's `emit()` and `emitList()` reach the JS context via `reactNativeHost.reactInstanceManager.currentReactContext`. Under New Architecture (Bridgeless), `HeadlessJsTaskService.getReactNativeHost()` throws `RuntimeException: You should not use ReactNativeHost directly in the New Architecture` the first time playback state changes. The patch adds a `currentReactContextOrNull()` helper that prefers `(applicationContext as ReactApplication).reactHost?.currentReactContext` and falls back to the legacy path inside try/catch.

**When can we drop this patch?**

Upstream landed all three fixes on `main` in [`5ce8412` (2025-06-25): "feat(android, ios): migrate the library to the new architecture"](https://github.com/doublesymmetry/react-native-track-player/commit/5ce8412). They were published as `5.0.0-alpha0` on 2025-08-12 — and as of this writing the [`latest` dist-tag still points to `4.1.2`](https://www.npmjs.com/package/react-native-track-player), with no nightlies since 2025-09-24. Adopting the alpha is risky for two reasons worth understanding before you do it:

- **5.0.0-alpha0 changes the iOS audio engine.** It declares `shaka-player ^4.7.9` as a peer dependency, replacing the AVPlayer-based path. Background audio, lockscreen controls, and AirPlay all need re-validation on iOS.
- **The branch has been quiet for ~7 months.** Treat it as alpha-grade until activity resumes or `5.0.0` ships stable.

**Drop the patch when:**

1. `react-native-track-player@5.x` ships on the `latest` dist-tag (check with `npm view react-native-track-player dist-tags`), AND
2. After upgrading and re-running `npx expo run:android` cold on a clean install, all three of these greps produce the expected results:

```bash
# 1. Block-body methods (no expression-body @ReactMethod returning Job)
grep -E "fun [a-z]+\([^)]*\) = scope\.launch" \
  node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt
# Expect: no output. If matches appear, the TurboModule issue is back.

# 2. emit() must use reactHost (or be otherwise New-Arch safe)
grep -n "reactNativeHost.reactInstanceManager" \
  node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt
# Expect: no output. If matches appear, the Bridgeless crash is back.

# 3. Strict-null fixes for getTrack / getActiveTrack
grep -c "originalItem!!" \
  node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/module/MusicModule.kt
# Expect: ≥ 2 OR upstream changed the type so !! is unnecessary. To verify the
# end-to-end story, temporarily delete patches/react-native-track-player+*.patch,
# run `npm install`, then `npx expo run:android`. If it builds and the app
# starts, the patch can go.
```

### `@react-native+gradle-plugin+0.83.2.patch`

Bumps `org.gradle.toolchains.foojay-resolver-convention` from `0.5.0` to `1.0.0` in `node_modules/@react-native/gradle-plugin/settings.gradle.kts`. The 0.5.0 / 0.10.0 jars reference `JvmVendorSpec.IBM_SEMERU`, an enum value Gradle 9.0 removed; configuration fails with `Class JvmVendorSpec does not have member field 'IBM_SEMERU'`. Foojay 1.0.0 (Aug 2025) added Gradle 9 support.

**When can we drop this patch?**

Upstream fix already merged: [`664acaf` (2026-03-31), PR #56210: "fix: upgrade foojay-resolver-convention to 1.0.0"](https://github.com/facebook/react-native/pull/56210). It is **not yet in any released version** — verified at the time of writing that `@react-native/gradle-plugin@0.85.2` (current `latest`) and `0.83.9` (latest patch on the `0.83-stable` channel we're on) both still pin foojay 0.5.0. The fix will likely first ship in **React Native 0.86**.

The gradle-plugin is version-locked to `react-native` itself — bumping it independently isn't safe. So this patch is tied to the broader RN upgrade, not a one-line bump.

**Drop the patch when:** this project upgrades to a React Native version that includes #56210 (most likely 0.86+). After the upgrade, verify:

```bash
grep "foojay-resolver-convention" \
  node_modules/@react-native/gradle-plugin/settings.gradle.kts
# Expect a version ≥ 1.0.0. If still 0.5.0 / 0.10.0 on Gradle ≥ 9, keep the patch.
```

### Operational notes

- Patches apply automatically on `npm install` via the `postinstall` script. If a patch fails to apply (because the underlying package version changed), `patch-package` prints a clear error pointing at the offending hunk.
- After bumping either of the two patched packages, re-run `npx expo run:android` cold to confirm. If everything still works, regenerate or delete the corresponding patch.

## Releasing to the App Store (iOS)

Submitting `main` to Apple App Review takes two CLI commands plus some App Store Connect work in the browser. The full flow:

### Prereqs

- **Expo account in the `mirlo-app` org.** Project ID `a2ccd2d1-…` (in [app.json](app.json)) lives under the `mirlo-app` organization. Get invited at https://expo.dev/accounts/mirlo-app/settings/members, then `eas login` with your own creds. Verify: `eas project:info` should print the project (not 403).
- **Apple Developer Program enrollment** ($99/yr) in your own name. The bundle ID `space.mirlo.mobile` (in [app.json](app.json)) must be registered under your Developer Program team at https://developer.apple.com/account/resources/identifiers/list — when registering a fresh one, no Capabilities checkboxes are needed (audio background playback is handled by Expo via Info.plist at build time, not at App ID level). Apple Developer Program membership is *separate* from App Store Connect access; you need the Developer Program one for `eas build` to sign.
- **`eas-cli` ≥ 18.x.** `npm install -g eas-cli`.

### Releasing a version (recurring)

The recurring flow once everything's set up is two commands plus filling out the App Store Connect web UI.

1. **Bump the version** in [app.json](app.json) — `expo.version` and both `runtimeVersion` fields (`expo.runtimeVersion` + `expo.ios.runtimeVersion`) — and the matching `version` in [package.json](package.json). All four should stay in sync. Bump them together so OTA updates don't accidentally target binaries with different native code.

2. **Build:**
   ```bash
   eas build --platform ios --profile production
   ```
   - `appVersionSource: "remote"` + `autoIncrement: true` in [eas.json](eas.json) means EAS owns `buildNumber` server-side. You don't edit it in [app.json](app.json).
   - First time only: EAS prompts for your Apple ID + 2FA, then asks "Select a Provider" — pick the team that owns the bundle ID (not your personal "Individual" team). To skip the prompt on future builds, set `expo.ios.appleTeamId` in [app.json](app.json) to your 10-char team ID.
   - Build runs on EAS (~15–30 min). Watch progress at the URL eas prints, or via `eas build:list`.

3. **Submit to App Store Connect:**
   ```bash
   eas submit --platform ios --profile production --latest
   ```
   - First time only: prompts for App Store Connect credentials. Generate an [App Store Connect API key](https://appstoreconnect.apple.com/access/integrations/api) (Issuer ID + Key ID + `.p8`) and feed those — EAS caches them for future submissions.
   - Apple processes the build (~15–60 min). It becomes available in App Store Connect → TestFlight/App Store after.

4. **Submit for review** (App Store Connect web UI). Once Apple finishes processing:
   - **My Apps → Mirlo → App Store** → new/in-progress version matching `expo.version`.
   - Fill: **What's New**, **Description**, **Keywords**, **Support URL** (https://mirlo.space), screenshots (at minimum 6.7" iPhone; capture from Xcode simulator).
   - **Build** section → pick the build you just submitted.
   - **App Privacy** wizard (new apps only): contact info + identifiers + usage data; linked to user; **not** used for tracking.
   - **App Review Information** → provide a real demo account on `api.mirlo.space` (Apple reviews against production, not the local Docker stack) and a one-line note like "Music streaming app. Delete Account is in the hamburger menu after logging in."
   - **Version Release**: pick **Manually release** so you control go-live.
   - **Add for Review** → **Submit to App Review**. Apple SLA: typically 24–48h, sometimes a week.

5. **After approval:** App Store Connect → version page → **Release This Version**. Global roll-out within ~1h.

### When you can skip the build (JS-only changes) — EAS Update

If the diff touches only JavaScript / assets, push an OTA update instead:

```bash
eas update --branch production --message "<short description>"
```

Existing installs phone home to `expo.updates.url` and pick up the new bundle on next launch. The [preview workflow](.github/workflows/preview.yml) handles the `preview` channel automatically on PR merge; production publishes are manual.

**Full rebuild + resubmit *is* required when any of these change:**

- Adding/removing native dependencies (anything with native iOS code).
- `expo` plugins in [app.json](app.json), or `expo.ios.bundleIdentifier`, entitlements, `Info.plist` keys.
- Expo SDK or React Native version.
- `expo.runtimeVersion` — must bump it whenever native code changes so OTA updates don't target stale binaries.

### Common snags

- **`Entity not authorized`** from `eas`: you're logged in as the wrong Expo user, or you haven't been added to the project's owning org. `eas whoami` to check, then `eas login`, then verify via `eas project:info`.
- **"Bundle identifier is not available to team X"** at the EAS build step: the bundle ID belongs to a different Apple Developer Program team than the one your Apple ID is on. Either be added to the right team (developer.apple.com → People → Invite — note: this is separate from App Store Connect's user list) OR register the bundle ID under your team and update `expo.ios.bundleIdentifier`.
- **Apple processing takes forever**: 15–60 min is normal. If a build's been "Processing" >2h, retry the submit.
- **Build number conflict on submit**: with `appVersionSource: "remote"`, EAS prevents this. If it happens anyway, you manually set a `buildNumber` somewhere — remove it.

## Contributing

_Branch Structure:_

**main** - Production branch (what users see in app store)

**preview** - Staging/Testing branch (for reviewing changes with our internal distribution builds before they go live)

**1. Create Feature Branch**

Always branch from main with the latest code
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

**2. Make Your Changes**

  - Write your code
  - Test locally with 'npm start' or 'npx expo start'
  - Commit

**3. Submit Pull Request**
   
   ***Important: Always target the 'preview' branch, never 'main'.**
  
   Then create a PR with:
   
   - Base branch: preview ← Your branch: feature/your-feature-name
   - Clear description of what you changed
   - Screenshots/videos if it's a UI change
   - 
**4. Testing Your Changes**
 
 After your PR merges to preview:

   - Changes are automatically available in our preview app builds
   - Maintainers will test your changes before promoting to production

### What Happens Next

- Your PR gets reviewed against the preview branch
- Once merged to preview, your changes automatically deploy to our testing environment
- After testing, maintainers merge preview → main for production release



Tap the hamburger (top right) → menu opens.
Tap Log in and sign in with whatever test/throwaway account you want to delete (the Delete Account button only appears when logged in).
After login: hamburger → menu → scroll to bottom → Delete account (red text).
You should see the new screen with the account-summary card (only nonzero rows shown, hidden entirely if zero).
Tap the Delete account button → native confirmation Alert appears.
Tap Cancel to verify the dialog dismisses cleanly. (Or Delete account to actually nuke the test account — this is the destructive irreversible step.)


listener@admin.example
test1234

