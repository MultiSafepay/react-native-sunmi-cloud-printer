import ExpoModulesCore
import SunmiPrinterSDK

protocol SunmiManagerDelegate: AnyObject {
  func didUpdateDevices(list: [SunmiDevice]) -> Void
  func didConnectPrinter() -> Void
  func didDisconnectPrinter() -> Void
}

class SunmiManager: NSObject {
  
  weak var delegate: SunmiManagerDelegate?
  private var timeout: Float
  private var devices: [SunmiDevice] {
    didSet {
      // Send a notification with the new updates
      self.delegate?.didUpdateDevices(list: devices)
    }
  }
  private var ipManager: SunmiPrinterIPManager?
  private var bluetoothManager: SunmiPrinterManager?
  private var currentPrinter: InternalSunmiPrinter?
  private var command: SunmiPrinterCommand?
  
  override init() {
    self.timeout = 8000
    self.devices = []
    super.init()
    
    defer {
      bluetoothManager = SunmiPrinterManager.shareInstance()
      ipManager = SunmiPrinterIPManager.shared()
      
      bluetoothManager?.bluetoothDelegate = self
      ipManager?.delegate = self
      
      ipManager?.deviceDisConnect({ [weak self] error in
        printDebugLog("LAN device did disconnect:\(String(describing: error))")
        self?.currentPrinter = nil
        self?.delegate?.didDisconnectPrinter()
      })
      bluetoothManager?.deviceDisConnect(block: { [weak self] periperhal,error  in
        printDebugLog("Bluetooth device (\(String(describing: periperhal)) did disconnect:\(String(describing: error))")
        self?.currentPrinter = nil
        self?.delegate?.didDisconnectPrinter()
      })
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
  
  func connectBluetoothPrinter(uuid: String, promise: Promise) {
    guard let bluetoothManager = bluetoothManager else {
      promise.rejectWithSunmiError(SunmiPrinterError.printerNotSetup)
      return
    }
    let bluetoothPrinter = devices.first(where: { device in
      if case .bluetooth(let sunmiPrinter) = device {
        return sunmiPrinter.uuid == uuid
      } else {
        return false
      }
    })
    guard case .bluetooth(let sunmiPrinter) = bluetoothPrinter else {
      promise.rejectWithSunmiError(SunmiPrinterError.printerNotSetup)
      return
    }
    let peripheral = sunmiPrinter.bluetoothPeripheral!
    currentPrinter = .bluetooth(peripheral: peripheral)
    bluetoothManager.connect(peripheral)
    promise.resolve()
  }
  
  func connectLanPrinter(ipAddress: String, force: Bool, promise: Promise) {
    guard let manager = self.ipManager else {
      promise.reject(SunmiPrinterError.printerNotSetup)
      return
    }
    printDebugLog("🟢 will connect to printer at \(ipAddress)")
    
    // Check if the IP address is in the list. If it's a new one, we must add a new fake device
    let exist = devices.contains(where: { device in
      if case .ip(let sunmiPrinter) = device {
        return sunmiPrinter.ip == ipAddress
      } else {
        return false
      }
    })
    
    if (!exist) {
      if (force) {
        let sunmiPrinter = SunmiPrinterDevice(interface: PrinterInterface.lan.rawValue, name: "Manual", ip: ipAddress)
        devices.append(.ip(sunmiPrinter))
      } else {
        promise.reject(SunmiPrinterError.printerNotFound)
        return
      }
    }
    
    currentPrinter = .ip(address: ipAddress)
    manager.connectSocket(withIP: ipAddress)
    promise.resolve()
  }

  func isPrinterConnected(promise: Promise) {
    guard let currentPrinter = currentPrinter,
            let bluetoothManager = bluetoothManager,
            let manager = self.ipManager else {
      promise.resolve(false)
      return
    }
    switch currentPrinter {
    case .bluetooth:
      promise.resolve(bluetoothManager.bluetoothIsConnection())
      break
    case .ip:
      promise.resolve(manager.isConnectedIPService())
      break
    }
  }
  
  func disconnectPrinter(promise: Promise) {
    printDebugLog("🟢 will disconnect printer")
    guard let currentPrinter = currentPrinter,
          let bluetoothManager = bluetoothManager,
          let manager = self.ipManager else {
      promise.reject(SunmiPrinterError.printerNotSetup)
      return
    }
    self.currentPrinter = nil
    switch currentPrinter {
    case .bluetooth:
      bluetoothManager.disConnectPeripheral()
      promise.resolve()
      break
    case .ip:
      manager.disConnectIPService()
      promise.resolve()
      break
    }
  }
  
  // -----------------------
  // Low Level API methods
  // -----------------------
    
  func lineFeed(lines: Int32, promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.lineFeed(lines)
    promise.resolve()
  }
  
  func setTextAlign(alignment: Int, promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.setAlignment(SMAlignStyle(rawValue: alignment))
    promise.resolve()
  }
  
  func setPrintModesBold(bold: Bool, doubleHeight: Bool, doubleWidth: Bool, promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.setPrintModesBold(bold, double_h: doubleHeight, double_w: doubleWidth)
    promise.resolve()
  }

  func restoreDefaultSettings(promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.restoreDefaultSettings()
    promise.resolve()
  }
  
  func restoreDefaultLineSpacing(promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.restoreDefaultLineSpacing()
    promise.resolve()
  }
  
  func addCut(fullCut: Bool, promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.cutPaper(fullCut)
    promise.resolve()
  }
  
  func addText(text: String, promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.appendText(text)
    promise.resolve()
  }
  
  func addImage(base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) {
    guard let image = imageFromBase64(base64) else {
      promise.rejectWithSunmiError(SunmiPrinterError.notValidImage)
      return
    }
      
    let imgHeight = image.size.height
    let imgWidth = image.size.width
      
    let size = CGSize(width: CGFloat(imageWidth), height: imgHeight*CGFloat(imageWidth)/imgWidth)
    guard let scaledImage = scaleImage(image, size: size) else {
      promise.rejectWithSunmiError(SunmiPrinterError.notValidImageSize)
      return
    }
    
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.append(scaledImage, mode: SMImageAlgorithm_DITHERING)
    promise.resolve()
  }
  
  func clearBuffer(promise: Promise) {
    self.command = nil
    let command = makeSunmiCommand()
    command.clearBuffer()
    self.command = command
    promise.resolve()
  }
  
  func sendData(promise: Promise) {
    guard let printer = currentPrinter else {
      promise.rejectWithSunmiError(SunmiPrinterError.printerNotSetup)
      return
    }
    
    switch printer {
    case .bluetooth:
      guard let bluetoothManager = bluetoothManager, bluetoothManager.bluetoothIsConnection() else {
        promise.rejectWithSunmiError(SunmiPrinterError.printerNotConnected)
        return
      }
      bluetoothManager.sendSuccess({
        promise.resolve()
      })
      bluetoothManager.sendFail({ error in
        promise.reject(error ?? SunmiPrinterError.printerNotSetup)
      })
      bluetoothManager.sendPrint(command?.getData())
    case .ip:
      guard let ipManager = ipManager, ipManager.isConnectedIPService() else {
        promise.rejectWithSunmiError(SunmiPrinterError.printerNotConnected)
        return
      }
      guard let commandData = command?.getData() else {
        promise.rejectWithSunmiError(SunmiPrinterError.emptyBuffer)
        return
      }
      ipManager.controlDevicePrinting(commandData, success: {
        promise.resolve()
      }, fail: { error in
        promise.reject(error!)
      })
    }
  }
  
  func openCashDrawer(promise: Promise) {
    guard let command = command else {
      promise.reject(SunmiPrinterError.emptyBuffer)
      return
    }
    command.openCashBox()
    promise.resolve()
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
    }
  }
  
  func didConectPrinter() {
    printDebugLog("🟢 did connect to Bluetooth printer")
    delegate?.didConnectPrinter()
  }
  
  func willDisconnectPrinter() {
    printDebugLog("🔴 did disconnect from Bluetooth printer")
    currentPrinter = nil
    delegate?.didDisconnectPrinter()
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
    }
  }
  
  func didConnectedIPPrinter() {
    printDebugLog("🟢 did connect to IP printer: \(String(describing: delegate))")
    delegate?.didConnectPrinter()
  }
  
  func didConnectedIPPrinterWithError(_ error: (any Error)!) {
    printDebugLog("🔴 did fail to connect to printer")
    printDebugLog(error.debugDescription)
    currentPrinter = nil
    delegate?.didDisconnectPrinter()
  }
  
  func finshedSearchPrinter() {
    printDebugLog("🟢 did finish search printer")
  }
  
  func didCancelSearching() {
    printDebugLog("🟢 did cancel search printer")
  }
}

private extension SunmiManager {
  func dispatchTime(fromMilliseconds milliseconds: Int) -> DispatchTime {
      let seconds = milliseconds / 1000
      let nanoSeconds = (milliseconds % 1000) * 1_000_000
      let uptimeNanoseconds = DispatchTime.now().uptimeNanoseconds + UInt64(seconds) * 1_000_000_000 + UInt64(nanoSeconds)
      return DispatchTime(uptimeNanoseconds: uptimeNanoseconds)
  }
  
  func imageFromBase64(_ base64: String) -> UIImage? {
    if let data = Data(base64Encoded: base64) {
      return UIImage(data: data)
    }
    return nil
  }
  
  func scaleImage(_ image: UIImage, size: CGSize) -> UIImage? {
    let scale: CGFloat = max(size.width/image.size.width, size.height/image.size.height);
    let width: CGFloat = image.size.width * scale;
    let height: CGFloat = image.size.height * scale;
    let imageRect: CGRect = CGRectMake((size.width - width)/2.0,
                                       (size.height - height)/2.0,
                                       width,
                                       height);

    UIGraphicsBeginImageContextWithOptions(size, false, 0);
    image.draw(in: imageRect)
    let newImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    return newImage;
  }
  
  func makeSunmiCommand() -> SunmiPrinterCommand {
    let command = SunmiPrinterCommand()
    command.setUtf8Mode(1)
    command.setPrintWidth(576)
    return command
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
  
  var bluetoothPeripheral: CBPeripheral? {
    return self.peripheral
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
  
  var bluetoothPeripheral: CBPeripheral? {
    return nil
  }
}

extension Promise {
  func rejectWithSunmiError(_ error: SunmiPrinterError) {
    reject(error.code, error.localizedDescription)
  }
}
