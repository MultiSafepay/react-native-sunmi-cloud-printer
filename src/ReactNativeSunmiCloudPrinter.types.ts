export type PrinterInterface = "LAN" | "BLUETOOTH" | "USB";

interface SunmiCloudPrinterI {
  interface: PrinterInterface;
}

export interface SunmiCloudLanPrinter extends SunmiCloudPrinterI {
  interface: "LAN";
  name: string;
  ip: string;
  serialNumber: string;
  mode: string;
}

export interface SunmiCloudBluetoohPrinter extends SunmiCloudPrinterI {
  interface: "BLUETOOTH";
  name: string;
  signalStrength: number;
  uuid: string;
}

export type SunmiCloudPrinter =
  | SunmiCloudBluetoohPrinter
  | SunmiCloudLanPrinter;

export type PrintersEventPayload = {
  printers: SunmiCloudPrinter[];
};

export type ReactNativeSunmiCloudPrinterViewProps = {
  name: string;
};
