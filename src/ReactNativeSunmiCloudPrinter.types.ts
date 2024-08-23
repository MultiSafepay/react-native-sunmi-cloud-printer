export type SunmiDevice = {
  name: string;
  rssi: number;
  uuid: string;
};

export type ChangeEventPayload = {
  devices: SunmiDevice[];
};

export type ReactNativeSunmiCloudPrinterViewProps = {
  name: string;
};

export type PrinterPortType = "LAN" | "BLUETOOTH" | "USB";
