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
} from "./ReactNativeSunmiCloudPrinter.types";
import ReactNativeSunmiCloudPrinterModule from "./ReactNativeSunmiCloudPrinterModule";
import ReactNativeSunmiCloudPrinterView from "./ReactNativeSunmiCloudPrinterView";

export { PrinterInterface, SunmiCloudPrinter };

export function setTimeout(timeout: number) {
  ReactNativeSunmiCloudPrinterModule.setTimeout(timeout);
}

export async function discoverPrinters(
  printerInterface: PrinterInterface
): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.discoverPrinters(printerInterface);
}

export async function setValueAsync(value: string) {
  return await ReactNativeSunmiCloudPrinterModule.setValueAsync(value);
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

export {
  ReactNativeSunmiCloudPrinterView,
  ReactNativeSunmiCloudPrinterViewProps,
  PrintersEventPayload,
};
