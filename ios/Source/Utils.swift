
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

enum InternalSunmiPrinter {
  case bluetooth
  case ip(address: String)
}

enum PrinterInterface: String {
  case lan = "LAN"
  case bluetooth = "BLUETOOTH"
}

enum SunmiPrinterError: Error {
  case invalidInterface(String)
  case notValidImage
  case notValidImageSize
  case printerNotConnected
  case printerNotFound
  case printerNotSetup
  case emptyBuffer
  
  var code: String {
    switch self {
    case .invalidInterface:
      return "ERROR_INVALID_INTERFACE"
    case .notValidImage:
      return "ERROR_IMAGE_NOT_VALID"
    case .notValidImageSize:
      return "ERROR_IMAGE_SIZE_NOT_VALID"
    case .printerNotConnected:
      return "ERROR_PRINTER_NOT_CONNECTED"
    case .printerNotFound:
      return "ERROR_PRINTER_NOT_FOUND"
    case .printerNotSetup:
      return "ERROR_PRINTER_NOT_SETUP"
    case .emptyBuffer:
      return "ERROR_EMPTY_BUFFER"
    }
    
  }
    
  var localizedDescription: String {
    switch self {
    case .invalidInterface(let interface):
      return "Invalid interface: \(interface)."
    case .notValidImage:
      return "Image not valid"
    case .notValidImageSize:
      return "Image size not valid"
    case .printerNotConnected:
      return "Printer not connected"
    case .printerNotFound:
      return "Printer not found"
    case .printerNotSetup:
      return "Printer not setup"
    case .emptyBuffer:
      return "Empty buffer"
    }
  }
  
  var errorTuple: (String, String) {
    return (code, localizedDescription)
  }
}


func printDebugLog(_ message: String) {
  #if DEBUG
  print(message)
  #endif
}
