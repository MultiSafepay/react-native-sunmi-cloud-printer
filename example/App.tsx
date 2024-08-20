import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as ReactNativeSunmiCloudPrinter from "react-native-sunmi-cloud-printer";

export default function App() {
  useEffect(() => {}, []);

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
