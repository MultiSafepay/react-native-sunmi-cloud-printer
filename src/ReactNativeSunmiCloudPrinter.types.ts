export type PrinterInterface = "LAN" | "BLUETOOTH" | "USB";

interface SunmiCloudPrinterI {
  interface: PrinterInterface;
}

export interface SunmiCloudLanPrinter extends SunmiCloudPrinterI {
  interface: "LAN";
  name: string;
  ip: string;
}

export interface SunmiCloudBluetoothPrinter extends SunmiCloudPrinterI {
  interface: "BLUETOOTH";
  name: string;
  uuid: string;
}

export interface SunmiCloudUSBPrinter extends SunmiCloudPrinterI {
  interface: "USB";
  name: string;
}

type SunmiErrorType =
  | "ERROR_INVALID_INTERFACE"
  | "ERROR_IMAGE_NOT_VALID"
  | "ERROR_IMAGE_SIZE_NOT_VALID"
  | "ERROR_PRINTER_NOT_CONNECTED"
  | "ERROR_INVALID_PERMISSIONS"
  | "ERROR_UNSUPPORTED_PLATFORM";

export class SunmiError extends Error {
  code?: SunmiErrorType;
  message: string;
  constructor(code: SunmiErrorType, message: string) {
    super();
    this.name = "SunmiError";
    this.code = code;
    this.message = message;
  }
}

export type SunmiCloudPrinter =
  | SunmiCloudBluetoothPrinter
  | SunmiCloudLanPrinter
  | SunmiCloudUSBPrinter;

export type PrintersEventPayload = {
  printers: SunmiCloudPrinter[];
};

export type PrinterConnectionPayload = {
  connected: boolean;
};

export type ReactNativeSunmiCloudPrinterViewProps = {
  name: string;
};
