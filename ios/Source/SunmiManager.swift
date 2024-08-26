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
    self.timeout = 5000
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
  
  func connectLanPrinter(ipAddress: String, promise: Promise) {
    guard let manager = self.ipManager else {
      promise.reject(SunmiPrinterError.printerNotConnected)
      return
    }
    printDebugLog("🟢 will connect to printer at \(ipAddress)")
    currentPrinter = .ip(address: ipAddress)
    SunmiPrinterIPManager.shared().connectSocket(withIP: ipAddress)
    promise.resolve()
  }
  
  func disconnectLanPrinter(promise: Promise) {
    guard let manager = self.ipManager else {
      promise.reject(SunmiPrinterError.printerNotConnected)
      return
    }
    printDebugLog("🟢 will disconnect LAN printer")
    manager.disConnectIPService()
    self.currentPrinter = nil
    promise.resolve()
  }
  
  func isLanConnected(promise: Promise) {
    guard let manager = self.ipManager else {
      promise.reject(SunmiPrinterError.printerNotConnected)
      return
    }
    promise.resolve(manager.isConnectedIPService())
  }
  
  func isBluetoothConnected(promise: Promise) {
    guard let manager = self.bluetoothManager else {
      promise.reject(SunmiPrinterError.printerNotConnected)
      return
    }
    promise.resolve(manager.bluetoothIsConnection())
  }
  
  // -----------------------
  // Low Level API methods
  // -----------------------
    
  func lineFeed(lines: Int32, promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.lineFeed(lines)
    promise.resolve()
  }
  
  func setTextAlign(alignment: Int, promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.setAlignment(SMAlignStyle(rawValue: alignment))
    promise.resolve()
  }
  
  func setPrintModesBold(bold: Bool, doubleHeight: Bool, doubleWidth: Bool, promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.setPrintModesBold(bold, double_h: doubleHeight, double_w: doubleWidth)
    promise.resolve()
  }

  func restoreDefaultSettings(promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.restoreDefaultSettings()
    promise.resolve()
  }
  
  func restoreDefaultLineSpacing(promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.restoreDefaultLineSpacing()
    promise.resolve()
  }
  
  func addCut(fullCut: Bool, promise: Promise) {
    if command == nil {
      command = SunmiPrinterCommand()
    }
    command?.cutPaper(fullCut)
    promise.resolve()
  }
  
  func addText(text: String, promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.setAlignment(SMAlignStyle(rawValue: 1))
    command?.appendText(text)
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
    
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.append(scaledImage, mode: SMImageAlgorithm_DITHERING)
    promise.resolve()
  }
  
  func clearBuffer(promise: Promise) {
    if command == nil {
      command = makeSunmiCommand()
    }
    command?.clearBuffer()
    promise.resolve()
  }
  
  func sendData(promise: Promise) {
    guard let printer = currentPrinter else {
      promise.rejectWithSunmiError(SunmiPrinterError.printerNotSetup)
      return
    }
    
    switch printer {
    case .bluetooth: break
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
    printDebugLog("🟢 did connect to IP printer")
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

extension Promise {
  func rejectWithSunmiError(_ error: SunmiPrinterError) {
    reject(error.code, error.localizedDescription)
  }
}
