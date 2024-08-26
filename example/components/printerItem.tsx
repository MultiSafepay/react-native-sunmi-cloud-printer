import { FC, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SunmiCloudPrinter } from "react-native-sunmi-cloud-printer";

interface Props {
  printer: SunmiCloudPrinter;
  selected?: boolean;
  connected?: boolean;
  onPress: () => void;
}

const PrinterItem: FC<Props> = ({ connected, printer, selected, onPress }) => {
  const details = useMemo(() => {
    switch (printer.interface) {
      case "BLUETOOTH":
        return `UUID: ${printer.uuid}\nSignal: ${printer.signalStrength}`;
      case "LAN":
        return `IP: ${printer.ip}\nSerial: ${printer.serialNumber}\nMode: ${printer.mode}`;
      case "USB":
        return `USB: ${printer.name}`;
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
          <Text numberOfLines={3}>{details}</Text>
        </View>
        {connected ? (
          <View
            style={{
              justifyContent: "center",
              marginHorizontal: 10,
              padding: 5,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: "green",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                paddingHorizontal: 5,
                color: "green",
              }}
            >{`Connected`}</Text>
          </View>
        ) : null}
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
    alignItems: "center",
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
