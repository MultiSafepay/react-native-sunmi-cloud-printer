import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import * as SunmiSDK from "react-native-sunmi-cloud-printer";

import Button from "../components/button";
import { Image } from "../components/image";
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
  const [connectionStatus, setConnectionStatus] = useState<
    "not-connected" | "connecting" | "connected"
  >("not-connected");
  const [printStatus, setPrintStatus] = useState<
    "Idle" | "Preparing" | "Printing" | "Printed"
  >("Idle");
  const [isVisibleModal, setIsVisibleModal] = useState(false);
  const safeAreaInsets = useSafeAreaInsets();
  const [manualIpAddress, setManualIpAddress] = useState<string | undefined>();

  const canPrint = useMemo(() => {
    return (
      selectedPrinter !== undefined &&
      connectionStatus === "connected" &&
      printStatus === "Idle"
    );
  }, [connectionStatus, selectedPrinter, printStatus]);

  const printers = useMemo((): SunmiSDK.SunmiCloudPrinter[] => {
    return discoveredPrinters.filter(
      (printer) => printer.interface === selectedInterface
    );
  }, [discoveredPrinters, selectedInterface]);

  const showError = useCallback((message: string) => {
    Alert.alert("Error", message);
  }, []);

  const onDisconnectPrinter = useCallback(() => {
    setSelectedPrinter(undefined);
    setPrintStatus("Idle");
    return new Promise<void>(async (resolve, reject) => {
      try {
        const isConnected = await SunmiSDK.isPrinterConnected();
        if (isConnected) {
          if (__DEV__) {
            console.log("🔌 Disconnecting printer...");
          }
          await SunmiSDK.disconnectPrinter();
          if (__DEV__) {
            console.log("✅ Printer disconnected");
          }
        }
        resolve();
      } catch (e) {
        if (__DEV__) {
          console.log("❌ Error disconnecting printer", e);
        }
        reject(e);
      }
    });
  }, []);

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

  const onConnectToPrinter = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log("🔌 Connecting to printer...", selectedPrinter);
      }
      const currentPrinter = selectedPrinter!;
      // If we have an open connection, we should not connect again. Manually, we check the current connection status.
      const isConnected = await SunmiSDK.isPrinterConnected();
      if (!isConnected) {
        setConnectionStatus("connecting");
        switch (currentPrinter.interface) {
          case "BLUETOOTH": {
            await SunmiSDK.connectBluetoothPrinter({
              uuid: currentPrinter.uuid,
            });
            break;
          }
          case "LAN": {
            await SunmiSDK.connectLanPrinter({
              ipAddress: currentPrinter.ip,
            });
            break;
          }
          case "USB": {
            await SunmiSDK.connectUSBPrinter({
              name: currentPrinter.name,
            });
            break;
          }
        }
      }
    } catch (error) {
      showSunmiError(error as any);
    }
  }, [selectedPrinter]);

  const onPrintTestPage = useCallback(async () => {
    // Update the print status to start the printing process
    setPrintStatus("Preparing");
  }, [connectionStatus, selectedPrinter]);

  const onDiscover = useCallback(async () => {
    const onCancel = () => {
      setDiscovering(false);
      setSelectedPrinter(undefined);
    };
    try {
      await onDisconnectPrinter();

      setSelectedPrinter(undefined);
      setDiscovering(true);

      if (selectedInterface) {
        await SunmiSDK.discoverPrinters(selectedInterface);
        // Stop discovering printers
        setDiscovering(false);
      }
    } catch (e) {
      const sunmiError = e as SunmiSDK.SunmiError | undefined;
      if (__DEV__) {
        console.log("❌ Error discovering printers", e);
      }
      if (sunmiError?.code === "ERROR_INVALID_PERMISSIONS") {
        // Request permissions
        try {
          const havePermissions = await SunmiSDK.checkBluetoothPermissions();

          if (!havePermissions) {
            console.log("Requesting Bluetooth permissions...");
            await SunmiSDK.requestBluetoothPermissions();
          }
        } catch (e) {
          showSunmiError(e as any);
        }
      } else {
        showSunmiError(e as any);
      }
      onCancel();
    }
  }, [selectedInterface]);

  const onSelectInterface = useCallback(
    (printerInterface: SunmiSDK.PrinterInterface | undefined) => {
      // Reset the selected printer when changing the interface
      onDisconnectPrinter();
      // Set the selected interface
      setSelectedInterface(printerInterface);
    },
    [onDisconnectPrinter]
  );

  const connectViaManualIpAddressButton = useMemo(() => {
    return (
      selectedInterface === "LAN" && (
        <Pressable
          disabled={
            !selectedInterface ||
            discovering ||
            connectionStatus === "connecting" ||
            printStatus === "Printing"
          }
          onPress={() => {
            setIsVisibleModal(true);
            if (Platform.OS === "android") {
              // On Android, we need first need to discover the printers.
              // Then, given the IP address, if it exists, we can set it manually.
              SunmiSDK.discoverPrinters("LAN").catch((e) => {
                showSunmiError(e as any);
              });
            }
          }}
          style={{ flexDirection: "row" }}
        >
          <Text style={{ fontWeight: "bold" }}>Set IP</Text>
        </Pressable>
      )
    );
  }, [connectionStatus, discovering, printStatus, selectedInterface]);

  const headerLeft = useMemo(() => {
    return () => Platform.OS === "ios" && connectViaManualIpAddressButton;
  }, [connectViaManualIpAddressButton]);

  const headerRight = useMemo(() => {
    return () => (
      <View style={{ flexDirection: "row" }}>
        {Platform.OS === "android" ? connectViaManualIpAddressButton : null}
        <Pressable
          disabled={
            !selectedInterface ||
            discovering ||
            connectionStatus === "connecting" ||
            printStatus === "Printing"
          }
          onPress={onDiscover}
          style={{ flexDirection: "row" }}
        >
          {discovering ? (
            <ActivityIndicator />
          ) : (
            <Text style={{ fontWeight: "bold" }}>Discover</Text>
          )}
        </Pressable>
      </View>
    );
  }, [
    connectionStatus,
    discovering,
    onDiscover,
    printStatus,
    selectedInterface,
  ]);

  useEffect(() => {
    // Set a title for the screen
    navigation.setOptions({
      title: "Sunmi Cloud Printer SDK",
      headerLeft,
      headerRight,
    });
  }, [headerRight, navigation]);

  useEffect(() => {
    // Setup the native module
    SunmiSDK.setup();

    // Set a timeout for the native module.
    SunmiSDK.setTimeout(8000);

    // Listen to changes in the native module.
    const printersSubscription = SunmiSDK.printersListener((event) => {
      setDiscoveredPrinters(event.printers);
    });
    const printerConnectionSubscription = SunmiSDK.printerConnectionListener(
      (event) => {
        setConnectionStatus(event.connected ? "connected" : "not-connected");
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

  const renderItem: ListRenderItem<SunmiSDK.SunmiCloudPrinter> = useCallback(
    ({ item }) => {
      const selected =
        selectedPrinter?.interface === item.interface &&
        selectedPrinter?.name === item.name;
      return (
        <PrinterItem
          printer={item}
          connected={connectionStatus === "connected"}
          selected={selected}
          onPress={() => {
            if (selected) {
              onDisconnectPrinter();
            } else {
              setSelectedPrinter(item);
            }
          }}
        />
      );
    },
    [connectionStatus, onDisconnectPrinter, selectedPrinter]
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

  // Keep track of the print status
  useEffect(() => {
    switch (printStatus) {
      case "Preparing": {
        if (connectionStatus) {
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
        break;
      }
      default:
        break;
    }
  }, [connectionStatus, printStatus]);

  const onDismissModal = useCallback(
    ({ disconnect }: { disconnect: boolean }) => {
      if (disconnect) {
        onDisconnectPrinter();
      }
      setIsVisibleModal(false);
    },
    []
  );

  const onSetManualIPAddress = useCallback(() => {
    onDismissModal({ disconnect: false });

    if (Platform.OS === "ios") {
      const printer: SunmiSDK.SunmiCloudPrinter = {
        interface: "LAN",
        name: "Manual",
        ip: manualIpAddress!,
      };
      setDiscoveredPrinters([printer]);
    } else {
      // Android
      // Search for the printer with the given IP address
      const printer = discoveredPrinters.find((printer) => {
        return printer.interface === "LAN" && printer.ip === manualIpAddress;
      });
      if (printer) {
        // Preselect the printer
        setSelectedPrinter(printer);
      } else {
        showError("Printer not found");
      }
    }
  }, [discoveredPrinters, manualIpAddress, showError]);

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVisibleModal}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            backgroundColor: "#fff",
            paddingTop: safeAreaInsets.top,
          }}
        >
          <Text style={{ fontWeight: "bold", paddingVertical: 5 }}>
            Set IP Address:
          </Text>
          <TextInput
            placeholder="IP Address:"
            onChangeText={(text) => {
              setManualIpAddress(text);
            }}
          />
          <View style={{ flexDirection: "row", marginTop: 15 }}>
            <Button
              title="Cancel"
              onPress={() => {
                onDismissModal({ disconnect: true });
              }}
            />
            <Button
              disabled={!manualIpAddress}
              backgroundColor="#581845"
              title="Set"
              textColor="white"
              onPress={onSetManualIPAddress}
            />
          </View>
        </View>
      </Modal>
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
                onSelectInterface("BLUETOOTH");
              }}
            />
            <View style={{ width: 5 }} />
            <Button
              title="Lan"
              selected={selectedInterface === "LAN"}
              onPress={() => {
                onSelectInterface("LAN");
              }}
            />
            <View style={{ width: 5 }} />
            {Platform.OS === "android" && (
              <Button
                title="USB"
                selected={selectedInterface === "USB"}
                onPress={() => {
                  onSelectInterface("USB");
                }}
              />
            )}
          </View>
        )}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          padding: 10,
        }}
      >
        <Button
          backgroundColor={
            connectionStatus === "connected" ? "#e74c3c" : "#34495e"
          }
          disabled={
            discovering ||
            !selectedPrinter ||
            connectionStatus === "connecting" ||
            printStatus === "Printing"
          }
          title={connectionStatus === "connected" ? "Disconnect" : "Connect"}
          textColor="white"
          onPress={() => {
            if (connectionStatus === "connected") {
              onDisconnectPrinter();
            } else {
              onConnectToPrinter();
            }
          }}
        />
        <Button
          backgroundColor="#581845"
          disabled={!canPrint}
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
