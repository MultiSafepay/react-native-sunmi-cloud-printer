import { useEffect } from "react";
import { useNavigation } from "expo-router";

import { StyleSheet, Text, View } from "react-native";
import * as ReactNativeSunmiCloudPrinter from "react-native-sunmi-cloud-printer";

export default function App() {
  const navigation = useNavigation();

  useEffect(() => {
    // Set a title for the screen
    navigation.setOptions({ title: "Sunmi Cloud Printer" });
  }, [navigation]);

  useEffect(() => {
    // Set a timeout for the native module.
    ReactNativeSunmiCloudPrinter.setTimeout(5000);

    // Listen to changes in the native module.
    const subscription = ReactNativeSunmiCloudPrinter.addChangeListener(
      (event) => {
        console.log("didReceiveEvent", event.devices);
      }
    );

    // Start scanning for devices.
    ReactNativeSunmiCloudPrinter.discoverPrinters("LAN");

    return () => {
      if (__DEV__) {
        console.log("❌ Remove subscription");
      }
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>{ReactNativeSunmiCloudPrinter.hello()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
