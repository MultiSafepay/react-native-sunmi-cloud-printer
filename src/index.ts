import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

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
  return ReactNativeSunmiCloudPrinterModule.isLanConnected();
}

// export async function disconnectLanPrinter(): Promise<void> {
//   return ReactNativeSunmiCloudPrinterModule.disconnectLanPrinter();
// }

interface ConnectBluetoothPrinterProps {
  uuid: string;
}
export async function connectBluetoothPrinter({
  uuid,
}: ConnectBluetoothPrinterProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.connectBluetoothPrinter(uuid);
}

// export async function disconnectBluetoothPrinter(): Promise<void> {
//   return ReactNativeSunmiCloudPrinterModule.disconnectBluetoothPrinter();
// }

interface ConnectUSBPrinterProps {
  name: string;
}
export async function connectUSBPrinter({
  name,
}: ConnectUSBPrinterProps): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.connectUSBPrinter(name);
}

export function isLanConnected(): Promise<boolean> {
  return ReactNativeSunmiCloudPrinterModule.isLanConnected();
}

export function isBluetoothConnected(): Promise<boolean> {
  return ReactNativeSunmiCloudPrinterModule.isBluetoothConnected();
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
