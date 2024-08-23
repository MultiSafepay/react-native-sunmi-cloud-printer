
protocol SunmiPrinter {
  var interface: String { get }
  // Bluetooth properties
  var name: String { get }
  var signalStrength: Float? { get }
  var uuid: String? { get }
  // IP properties
  var ip: String? { get }
  var serialNumber: String? { get }
  var mode: String? { get }
}

extension SunmiPrinter {
  func toDictionary() -> [String: Any?] {
    return [
      "interface": interface,
      "name": name,
      "signalStrength": signalStrength,
      "uuid": uuid,
      "ip": ip,
      "serialNumber": serialNumber,
      "mode": mode
    ]
  }
}

struct SunmiPrinterDevice: SunmiPrinter {
  var interface: String
  var name: String
  var signalStrength: Float?
  var uuid: String?
  var ip: String?
  var serialNumber: String?
  var mode: String?
}

extension SunmiPrinterDevice: Codable {}

enum SunmiDevice {
  case bluetooth(SunmiPrinter)
  case ip(SunmiPrinter)
}

extension SunmiDevice {
  func toDictionary() -> [String: Any?] {
    switch self {
    case let .bluetooth(device):
      return device.toDictionary()
    case let .ip(device):
      return device.toDictionary()
    }
  }
}

enum PrinterInterface: String {
  case lan = "LAN"
  case bluetooth = "BLUETOOTH"
}

enum SunmiPrinterError: Error {
    case invalidInterface(String)
    
    var localizedDescription: String {
        switch self {
        case .invalidInterface(let interface):
            return "Invalid interface: \(interface)."
        }
    }
}


func printDebugLog(_ message: String) {
  #if DEBUG
  print(message)
  #endif
}
