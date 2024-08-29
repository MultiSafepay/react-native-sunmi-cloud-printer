import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
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
import { Image } from "../components/image";

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
  const [connectedPrinter, setConnectedPrinter] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<
    "Idle" | "Preparing" | "Printing" | "Printed"
  >("Idle");

  const printers = useMemo((): SunmiSDK.SunmiCloudPrinter[] => {
    return discoveredPrinters.filter(
      (printer) => printer.interface === selectedInterface
    );
  }, [discoveredPrinters, selectedInterface]);

  const showError = useCallback((message: string) => {
    Alert.alert("Error", message);
  }, []);

  const onDisconnectPrinter = useCallback(async () => {
    await SunmiSDK.isPrinterConnected();
    SunmiSDK.disconnectPrinter().catch((e) => {
      if (__DEV__) {
        console.log("❌ Error disconnecting printer", e);
      }
    });
  }, []);

  const onDiscover = useCallback(() => {
    if (selectedInterface) {
      // Disconnect
      onDisconnectPrinter();

      // Clear the selected printer
      setSelectedPrinter(undefined);
      // Start discovering printers
      setDiscovering(true);
      SunmiSDK.discoverPrinters(selectedInterface)
        .catch((e: SunmiSDK.SunmiError | undefined) => {
          if (__DEV__) {
            console.log("❌ Error discovering printers", e);
          }
          showSunmiError(e as any);
        })
        .finally(() => {
          // Stop discovering printers
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
    SunmiSDK.setTimeout(8000);

    // Listen to changes in the native module.
    const printersSubscription = SunmiSDK.printersListener((event) => {
      setDiscoveredPrinters(event.printers);
    });
    const printerConnectionSubscription = SunmiSDK.printerConnectionListener(
      (event) => {
        setConnectedPrinter(event.connected);
      }
    );

    return () => {
      if (__DEV__) {
        console.log("❌ Remove subscriptions");
      }
      printersSubscription.remove();
      printerConnectionSubscription.remove();
    };
  }, []);

  const deselectPrinter = useCallback(() => {
    setSelectedPrinter(undefined);
    setPrintStatus("Idle");
    onDisconnectPrinter();
  }, [onDisconnectPrinter]);

  const renderItem: ListRenderItem<SunmiSDK.SunmiCloudPrinter> = useCallback(
    ({ item }) => {
      const selected =
        selectedPrinter?.interface === item.interface &&
        selectedPrinter?.name === item.name;
      return (
        <PrinterItem
          printer={item}
          connected={connectedPrinter}
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
    [connectedPrinter, deselectPrinter, selectedPrinter]
  );

  const showSunmiError = useCallback(
    (error: SunmiSDK.SunmiError | undefined) => {
      console.error(error);
      const errorMessage =
        error?.code && error?.message
          ? `Code:${error.code}\nReason:${error.message}`
          : `An error occurred`;
      showError(errorMessage);
    },
    []
  );

  const onSendTestPrint = useCallback(async () => {
    try {
      await SunmiSDK.clearBuffer();
      await SunmiSDK.addImage({
        base64: Image.base64,
        width: Image.width,
        height: Image.height,
      });
      await SunmiSDK.lineFeed(4);
      await SunmiSDK.addCut(false);
      await SunmiSDK.sendData();
    } catch (e) {
      showSunmiError(e as any);
    }
  }, []);

  const onPrintTestPage = useCallback(async () => {
    if (selectedPrinter) {
      try {
        // Set the print status to preparing
        setPrintStatus("Preparing");
        switch (selectedPrinter.interface) {
          case "BLUETOOTH": {
            if (!connectedPrinter) {
              await SunmiSDK.connectBluetoothPrinter({
                uuid: selectedPrinter.uuid,
              });
            }
            break;
          }
          case "LAN": {
            // If we have an open connection, we should not connect again. Otherwise, the printer will be disconnected.
            if (!connectedPrinter) {
              await SunmiSDK.connectLanPrinter({
                ipAddress: selectedPrinter.ip,
              });
            }
            break;
          }
          case "USB": {
            if (!connectedPrinter) {
              await SunmiSDK.connectUSBPrinter({
                name: selectedPrinter.name,
              });
            }
            break;
          }
        }
      } catch (error) {
        showSunmiError(error as any);
      }
    }
  }, [connectedPrinter, selectedPrinter]);

  // Keep track of the print status
  useEffect(() => {
    switch (printStatus) {
      case "Preparing": {
        if (connectedPrinter) {
          setPrintStatus("Printing");
        }
        break;
      }
      case "Printing": {
        onSendTestPrint().finally(() => {
          setPrintStatus("Printed");
        });
        break;
      }
      case "Printed": {
        setPrintStatus("Idle");
      }
      default:
        break;
    }
  }, [connectedPrinter, printStatus]);

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
          disabled={!selectedPrinter || printStatus !== "Idle"}
          title="Print Test Page"
          textColor="white"
          onPress={onPrintTestPage}
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
