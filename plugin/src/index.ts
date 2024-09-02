import { withAppBuildGradle, ConfigPlugin } from "expo/config-plugins";

function replace(contents: string, match: string, replace: string) {
  if (!contents.includes(match)) {
    return contents;
  }
  return contents.replace(match, replace);
}

const withLocalAAR: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = replace(
        config.modResults.contents,
        `implementation("com.facebook.react:react-android")`,
        `implementation("com.facebook.react:react-android")\n    implementation files('../../node_modules/react-native-sunmi-cloud-printer/android/libs/externalprinterlibrary2-1.0.12-release.aar')`
      );
    } else {
      throw new Error("Can't enable APK optimizations because it's not groovy");
    }
    return config;
  });
};

export default withLocalAAR;
