// Local entry point that re-exports expo-router's entry.
// Using a project-local file (rather than pointing package.json "main" directly
// at "expo-router/entry") keeps the entry path outside node_modules, which is
// what the expo-updates `createReleaseUpdatesResources` build phase needs to
// resolve the Metro assets map on Android. Pointing "main" straight at
// "expo-router/entry" makes that phase look up `node_modules/expo-router/entry`
// and fail with "resource ... was not found".
import "expo-router/entry";
