import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

import { Platform, PermissionsAndroid } from "react-native";

// Import the native module. On web, it will be resolved to ReactNativeSunmiCloudPrinter.web.ts
// and on native platforms to ReactNativeSunmiCloudPrinter.ts
import {
  PrintersEventPayload,
  ReactNativeSunmiCloudPrinterViewProps,
  PrinterInterface,
  SunmiCloudPrinter,
  SunmiError,
  PrinterConnectionPayload,
} from "./ReactNativeSunmiCloudPrinter.types";
import ReactNativeSunmiCloudPrinterModule from "./ReactNativeSunmiCloudPrinterModule";
import ReactNativeSunmiCloudPrinterView from "./ReactNativeSunmiCloudPrinterView";

export { PrinterInterface, SunmiCloudPrinter, SunmiError };

export function setTimeout(timeout: number) {
  ReactNativeSunmiCloudPrinterModule.setTimeout(timeout);
}

export async function discoverPrinters(
  printerInterface: PrinterInterface
): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.discoverPrinters(printerInterface);
}

export async function disconnectPrinter(): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.disconnectPrinter();
}

interface ConnectLanPrinterProps {
  ipAddress: string;
}
export async function connectLanPrinter({
  ipAddress,
}: ConnectLanPrinterProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.connectLanPrinter(ipAddress);
}

export function isPrinterConnected(): Promise<boolean> {
  return ReactNativeSunmiCloudPrinterModule.isPrinterConnected();
}

export function checkBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    return ReactNativeSunmiCloudPrinterModule.checkBluetoothPermissions();
  } else {
    return Promise.resolve(true);
  }
}

export const requestBluetoothPermissions = async (): Promise<void> => {
  try {
    if (Platform.OS === "android") {
      // 1) Request Location permission
      const grantedLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Access Fine Location",
          message:
            "Sunmi Cloud Printer needs access to your location for bluetooth connection",
          buttonPositive: "OK",
        }
      );
      if (grantedLocation !== PermissionsAndroid.RESULTS.GRANTED) {
        // If never asked again... we must inform the customer that this permission is required to run the app
        throw new SunmiError(
          "ERROR_INVALID_PERMISSIONS",
          "Access Fine Location permission denied. Please, go to Android settings and enable it."
        );
      }

      // 2) Request extra Bluetooth permissions (required for Android API 31+)
      if (Platform.Version >= 31) {
        // BLUETOOTH_SCAN
        const grantedBluetoothScan = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Access Bluetooth Scan",
            message:
              "Sunmi Cloud Printer needs access to your bluetooth for printing",
            buttonPositive: "OK",
          }
        );
        if (grantedBluetoothScan !== PermissionsAndroid.RESULTS.GRANTED) {
          // If never asked again... we must inform the customer that this permission is required to run the app
          throw new SunmiError(
            "ERROR_INVALID_PERMISSIONS",
            "Bluetooth permission denied. Please, go to Android settings and enable it."
          );
        }

        // BLUETOOTH_CONNECT
        const grantedBluetoothConnect = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Access Bluetooth",
            message:
              "Sunmi Cloud Printer needs access to your bluetooth for printing",
            buttonPositive: "OK",
          }
        );
        if (grantedBluetoothConnect !== PermissionsAndroid.RESULTS.GRANTED) {
          // If never asked again... we must inform the customer that this permission is required to run the app
          throw new SunmiError(
            "ERROR_INVALID_PERMISSIONS",
            "Bluetooth permission denied. Please, go to Android settings and enable it."
          );
        }
      }
    }
    return Promise.resolve();
  } catch (e) {
    if (__DEV__) {
      console.error("Error requesting Bluetooth permissions", e);
    }
    return Promise.reject(e);
  }
};

interface ConnectBluetoothPrinterProps {
  uuid: string;
}
export async function connectBluetoothPrinter({
  uuid,
}: ConnectBluetoothPrinterProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.connectBluetoothPrinter(uuid);
}

interface ConnectUSBPrinterProps {
  name: string;
}
export async function connectUSBPrinter({
  name,
}: ConnectUSBPrinterProps): Promise<void> {
  if (Platform.OS === "android") {
    return ReactNativeSunmiCloudPrinterModule.connectUSBPrinter(name);
  } else {
    return Promise.reject(
      new SunmiError(
        "ERROR_UNSUPPORTED_PLATFORM",
        "USB connection is not supported on this platform"
      )
    );
  }
}

// ---------------
// Low level APIs
// ---------------

export function lineFeed(lines: number): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.lineFeed(lines);
}

export function setTextAlign(
  textAlign: "left" | "right" | "center"
): Promise<void> {
  const align = textAlign === "left" ? 0 : textAlign === "right" ? 2 : 1;
  return ReactNativeSunmiCloudPrinterModule.setTextAlign(align);
}

interface SetPrintModesProps {
  bold: boolean;
  doubleHeight: boolean;
  doubleWidth: boolean;
}
export function setPrintModesBold({
  bold,
  doubleHeight,
  doubleWidth,
}: SetPrintModesProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.setPrintModesBold(
    bold,
    doubleHeight,
    doubleWidth
  );
}

export function restoreDefaultSettings(): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.restoreDefaultSettings();
}

export function restoreDefaultLineSpacing(): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.restoreDefaultLineSpacing();
}

export function addCut(fullCut: boolean): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.addCut(fullCut);
}

export function addText(text: string): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.addText(text);
}

interface AddImageProps {
  base64: string;
  width: number;
  height: number;
}
export function addImage({
  base64,
  width,
  height,
}: AddImageProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.addImage(
    base64,
    Math.floor(width),
    Math.floor(height)
  );
}

export function clearBuffer(): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.clearBuffer();
}

export function sendData(): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.sendData();
}

const emitter = new EventEmitter(
  ReactNativeSunmiCloudPrinterModule ??
    NativeModulesProxy.ReactNativeSunmiCloudPrinter
);

export function printersListener(
  listener: (event: PrintersEventPayload) => void
): Subscription {
  return emitter.addListener<PrintersEventPayload>(
    "onUpdatePrinters",
    listener
  );
}

export function printerConnectionListener(
  listener: (event: PrinterConnectionPayload) => void
): Subscription {
  return emitter.addListener<PrinterConnectionPayload>(
    "onPrinterConnectionUpdate",
    listener
  );
}

export {
  ReactNativeSunmiCloudPrinterView,
  ReactNativeSunmiCloudPrinterViewProps,
  PrintersEventPayload,
};
