import { FC, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SunmiCloudPrinter } from "react-native-sunmi-cloud-printer";

interface Props {
  printer: SunmiCloudPrinter;
  selected?: boolean;
  onPress: () => void;
}

const PrinterItem: FC<Props> = ({ printer, selected, onPress }) => {
  const details = useMemo(() => {
    switch (printer.interface) {
      case "BLUETOOTH":
        return `UUID: ${printer.uuid}, Signal: ${printer.signalStrength}`;
      case "LAN":
        return `IP: ${printer.ip}, Serial: ${printer.serialNumber}, Mode: ${printer.mode}`;
    }
  }, [printer]);

  return (
    <Pressable
      android_ripple={{ color: "#eee" }}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.8 }]}
      onPress={onPress}
    >
      <View style={styles.button}>
        <View style={styles.description}>
          <Text style={styles.title}>{printer.name}</Text>
          <Text>{details}</Text>
        </View>
        {selected ? (
          <View style={{ justifyContent: "center" }}>
            <Text>✅</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.separator} />
    </Pressable>
  );
};
export default PrinterItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  button: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  description: {
    flexGrow: 1,
  },
  title: {
    fontWeight: "bold",
  },
  separator: {
    backgroundColor: "#eee",
    height: 1,
    marginTop: 2,
    width: "100%",
    marginLeft: 10,
  },
});
