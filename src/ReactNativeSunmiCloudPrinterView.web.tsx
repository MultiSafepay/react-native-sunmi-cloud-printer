import * as React from "react";

import { ReactNativeSunmiCloudPrinterViewProps } from "./ReactNativeSunmiCloudPrinter.types";

export default function ReactNativeSunmiCloudPrinterView(
  props: ReactNativeSunmiCloudPrinterViewProps
) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
