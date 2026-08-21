const { withAppBuildGradle } = require("expo/config-plugins");

// Works around a real bug in expo-modules-autolinking: the "expo" package's
// react-native.config.js does a self-require of 'expo-modules-autolinking/exports'
// to decide the packageImportPath for the classic autolinking bridge. That
// require throws when evaluated inside expo-modules-autolinking's own
// require-from-string sandbox (confirmed by reproducing it directly), the
// caller swallows the error, and autolinking falls back to guessing the
// import path from the AndroidManifest namespace + a globbed class name —
// producing the broken `expo.core.ExpoModulesPackage` instead of the real
// `expo.modules.ExpoModulesPackage`, which fails to compile.
//
// A `pnpm patch` fixes this locally, but EAS Build's servers keep producing
// the broken output even with a matching patched lockfile (likely a pnpm
// store cache that --clear-cache doesn't invalidate). This plugin patches
// the generated file directly, in the Gradle build itself, so it's fixed
// regardless of what happens upstream in the JS dependency install.
module.exports = function withFixExpoModulesAutolinking(config) {
  return withAppBuildGradle(config, (config) => {
    const marker = "withFixExpoModulesAutolinking";
    if (config.modResults.contents.includes(marker)) {
      return config;
    }

    const snippet = `
// ${marker}: see plugins/withFixExpoModulesAutolinking.js
tasks.matching { it.name == "generateAutolinkingPackageList" }.configureEach {
    doLast {
        def packageListFile = file("\${buildDir}/generated/autolinking/src/main/java/com/facebook/react/PackageList.java")
        if (packageListFile.exists()) {
            def original = packageListFile.text
            def fixed = original.replace("expo.core.ExpoModulesPackage", "expo.modules.ExpoModulesPackage")
            if (fixed != original) {
                packageListFile.text = fixed
                println("[${marker}] Fixed broken expo.core.ExpoModulesPackage import in PackageList.java")
            }
        }
    }
}
`;

    config.modResults.contents += snippet;
    return config;
  });
};
