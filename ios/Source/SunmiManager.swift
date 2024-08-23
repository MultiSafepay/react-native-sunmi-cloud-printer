import ExpoModulesCore
import SunmiPrinterSDK

protocol SunmiManagerDelegate: AnyObject {
  func didUpdateDevices(list: [SunmiDevice]) -> Void
}

class SunmiManager: NSObject {
  
  weak var delegate: SunmiManagerDelegate?
  private var timeout: Float
  private var devices: [SunmiDevice]
  private weak var ipManager: SunmiPrinterIPManager?
  private weak var bluetoothManager: SunmiPrinterManager?
  
  override init() {
    self.timeout = 5000
    self.devices = []
    super.init()
    
    defer {
      bluetoothManager = SunmiPrinterManager.shareInstance()
      ipManager = SunmiPrinterIPManager.shared()
      
      SunmiPrinterManager.shareInstance().bluetoothDelegate = self
      SunmiPrinterIPManager.shared().delegate = self
    }
  }
  
  func setTimeout(_ timeout: Float) {
    printDebugLog("🟢 did set timeout: [timeout=\(timeout)]")
    self.timeout = timeout
  }
  
  func discoverPrinters(printerInterface: PrinterInterface, promise: Promise) {
    printDebugLog("🟢 did start to discover printers: [interface=\(printerInterface.rawValue)]")
    
    // Every time we trigger discover, we clear the list of devices
    devices = []
    
    let deadline = dispatchTime(fromMilliseconds: Int(timeout))
    DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: deadline, execute: { [weak self] in
      switch printerInterface {
      case .bluetooth:
        self?.bluetoothManager?.scanPeripheral()
        break
      case .lan:
        self?.ipManager?.startSearchPrinter(withIp: nil)
        break
      }
      promise.resolve()
    })
  }
}

extension SunmiManager: PrinterManagerDelegate {
  func discoveredDevice(_ bluetoothDevice: SunmiBlePrinterModel) {
    printDebugLog("🟢 did discover a bluetooth device: [\(bluetoothDevice.deviceName), \(bluetoothDevice.uuidString)]")
    
    let hasDevice = devices.contains(where: { device in
      if case .bluetooth(let sunmiBluetoothDevice) = device {
        return sunmiBluetoothDevice.uuid == bluetoothDevice.uuidString
      } else {
        return false
      }
    })
    
    // We only include the device if we're sure the device is not already in the list
    if !hasDevice {
      devices.append(.bluetooth(bluetoothDevice))
      
      // Send a notification
      delegate?.didUpdateDevices(list: devices)
    }
  }
}

extension SunmiManager: IPPrinterManagerDelegate {
  func discoverIPPrinter(_ printerModel: SunmiIpPrinterModel!) {
    printDebugLog("🟢 did discover an ip device: [\(printerModel.deviceName), \(printerModel.deviceIP), \(printerModel.deviceSN)]")
    
    let hasDevice = devices.contains(where: { device in
      if case .ip(let sunmiIpDevice) = device {
        return sunmiIpDevice.name == printerModel.name
      } else {
        return false
      }
    })
    
    // We only include the device if we're sure the device is not already in the list
    if !hasDevice {
      devices.append(.ip(printerModel))
      
      // Send a notification
      delegate?.didUpdateDevices(list: devices)
    }
  }
}

private extension SunmiManager {
  func dispatchTime(fromMilliseconds milliseconds: Int) -> DispatchTime {
      let seconds = milliseconds / 1000
      let nanoSeconds = (milliseconds % 1000) * 1_000_000
      let uptimeNanoseconds = DispatchTime.now().uptimeNanoseconds + UInt64(seconds) * 1_000_000_000 + UInt64(nanoSeconds)
      return DispatchTime(uptimeNanoseconds: uptimeNanoseconds)
  }
}

extension SunmiBlePrinterModel: SunmiPrinter {
  var interface: String {
    return PrinterInterface.bluetooth.rawValue
  }
  
  var name: String {
    return self.deviceName
  }
  
  var signalStrength: Float? {
    return Float(truncating: self.rssi)
  }
  
  var uuid: String? {
    return self.uuidString
  }
  
  var ip: String? {
    return nil
  }
  
  var serialNumber: String? {
    return nil
  }
  
  var mode: String? {
    return nil
  }
}

extension SunmiIpPrinterModel: SunmiPrinter {
  var interface: String {
    return PrinterInterface.lan.rawValue
  }
  
  var name: String {
    return self.deviceName
  }
  
  var signalStrength: Float? {
    return nil
  }
  
  var uuid: String? {
    return nil
  }
  
  var ip: String? {
    return self.deviceIP
  }
  
  var serialNumber: String? {
    return self.deviceSN
  }
  
  var mode: String? {
    return self.deviceMode
  }
}
