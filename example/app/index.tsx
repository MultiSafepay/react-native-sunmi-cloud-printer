import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SunmiSDK from "react-native-sunmi-cloud-printer";

import Button from "../components/button";
import Pressable from "../components/pressable";
import PrinterItem from "../components/printerItem";

export default function App() {
  const navigation = useNavigation();
  const [discovering, setDiscovering] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<
    SunmiSDK.PrinterInterface | undefined
  >();
  const [discoveredPrinters, setDiscoveredPrinters] = useState<
    SunmiSDK.SunmiCloudPrinter[]
  >([]);
  const [selectedPrinter, setSelectedPrinter] = useState<
    SunmiSDK.SunmiCloudPrinter | undefined
  >();

  const printers = useMemo((): SunmiSDK.SunmiCloudPrinter[] => {
    return discoveredPrinters.filter(
      (printer) => printer.interface === selectedInterface
    );
  }, [discoveredPrinters, selectedInterface]);

  const onDiscover = useCallback(() => {
    if (selectedInterface) {
      setDiscovering(true);
      SunmiSDK.discoverPrinters(selectedInterface).finally(() => {
        setDiscovering(false);
      });
    }
  }, [selectedInterface]);

  const headerRight = useMemo(() => {
    return () => (
      <Pressable
        disabled={discovering || !selectedInterface}
        onPress={onDiscover}
        style={{ flexDirection: "row" }}
      >
        {discovering ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ fontWeight: "bold" }}>{"Discover"}</Text>
        )}
      </Pressable>
    );
  }, [discovering, onDiscover, selectedInterface]);

  useEffect(() => {
    // Set a title for the screen
    navigation.setOptions({
      title: "Sunmi Cloud Printer SDK",
      headerRight,
    });
  }, [headerRight, navigation]);

  useEffect(() => {
    // Set a timeout for the native module.
    SunmiSDK.setTimeout(5000);

    // Listen to changes in the native module.
    const subscription = SunmiSDK.printersListener((event) => {
      setDiscoveredPrinters(event.printers);
    });

    return () => {
      if (__DEV__) {
        console.log("❌ Remove subscription");
      }
      subscription.remove();
    };
  }, []);

  const deselectPrinter = useCallback(() => {
    setSelectedPrinter(undefined);
  }, []);

  const renderItem: ListRenderItem<SunmiSDK.SunmiCloudPrinter> = useCallback(
    ({ item }) => {
      const selected =
        selectedPrinter?.interface === item.interface &&
        selectedPrinter?.name === item.name;
      return (
        <PrinterItem
          printer={item}
          selected={selected}
          onPress={() => {
            if (selected) {
              deselectPrinter();
            } else {
              setSelectedPrinter(item);
            }
          }}
        />
      );
    },
    [deselectPrinter, selectedPrinter]
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
      <FlatList
        data={printers}
        renderItem={renderItem}
        keyExtractor={(printer, index) =>
          `${index}-${printer.interface}-${printer.name}`
        }
        style={{ width: "100%" }}
        ListHeaderComponent={() => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 5,
            }}
          >
            <Button
              title="Bluetooth"
              selected={selectedInterface === "BLUETOOTH"}
              onPress={() => {
                setSelectedInterface("BLUETOOTH");
              }}
            />
            <View style={{ width: 5 }} />
            <Button
              title="Lan"
              selected={selectedInterface === "LAN"}
              onPress={() => {
                setSelectedInterface("LAN");
              }}
            />
            <View style={{ width: 5 }} />
            {Platform.OS === "android" && (
              <Button
                title="USB"
                selected={selectedInterface === "USB"}
                onPress={() => {
                  setSelectedInterface("USB");
                }}
              />
            )}
          </View>
        )}
      />
      <View style={{ width: "100%", paddingBottom: 5 }}>
        <Button
          backgroundColor="#581845"
          disabled={!selectedPrinter}
          title="Print Test Page"
          textColor="white"
          onPress={() => {
            console.log("Print Test Page");
          }}
        />
      </View>
    </SafeAreaView>
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
