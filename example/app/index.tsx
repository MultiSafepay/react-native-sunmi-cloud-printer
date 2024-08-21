import { useEffect } from "react";
import { useNavigation } from "expo-router";

import { StyleSheet, Text, View } from "react-native";
import * as ReactNativeSunmiCloudPrinter from "react-native-sunmi-cloud-printer";

export default function App() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: "Sunmi Cloud Printer" });
  }, [navigation]);

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
