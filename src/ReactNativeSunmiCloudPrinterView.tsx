import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";

import { ReactNativeSunmiCloudPrinterViewProps } from "./ReactNativeSunmiCloudPrinter.types";

const NativeView: React.ComponentType<ReactNativeSunmiCloudPrinterViewProps> =
  requireNativeViewManager("ReactNativeSunmiCloudPrinter");

export default function ReactNativeSunmiCloudPrinterView(
  props: ReactNativeSunmiCloudPrinterViewProps
) {
  return <NativeView {...props} />;
}
