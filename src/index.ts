import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ReactNativeSunmiCloudPrinter.web.ts
// and on native platforms to ReactNativeSunmiCloudPrinter.ts
import {
  ChangeEventPayload,
  ReactNativeSunmiCloudPrinterViewProps,
  PrinterPortType,
} from "./ReactNativeSunmiCloudPrinter.types";
import ReactNativeSunmiCloudPrinterModule from "./ReactNativeSunmiCloudPrinterModule";
import ReactNativeSunmiCloudPrinterView from "./ReactNativeSunmiCloudPrinterView";

// Get the native constant value.
export const PI = ReactNativeSunmiCloudPrinterModule.PI;

export function hello(): string {
  return ReactNativeSunmiCloudPrinterModule.hello();
}

export function setTimeout(timeout: number) {
  ReactNativeSunmiCloudPrinterModule.setTimeout(timeout);
}

export async function discoverPrinters(
  portType: PrinterPortType
): Promise<void> {
  return ReactNativeSunmiCloudPrinterModule.discoverPrinters(portType);
}

export async function setValueAsync(value: string) {
  return await ReactNativeSunmiCloudPrinterModule.setValueAsync(value);
}

const emitter = new EventEmitter(
  ReactNativeSunmiCloudPrinterModule ??
    NativeModulesProxy.ReactNativeSunmiCloudPrinter
);

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}

export {
  ReactNativeSunmiCloudPrinterView,
  ReactNativeSunmiCloudPrinterViewProps,
  ChangeEventPayload,
};
