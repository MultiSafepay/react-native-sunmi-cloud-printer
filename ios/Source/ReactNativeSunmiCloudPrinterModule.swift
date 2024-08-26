import ExpoModulesCore
import SunmiPrinterSDK

public class ReactNativeSunmiCloudPrinterModule: Module {
  
  private let sunmiManager = SunmiManager()
  
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeSunmiCloudPrinter')` in JavaScript.
    Name("ReactNativeSunmiCloudPrinter")

    // Defines event names that the module can send to JavaScript.
    Events("onUpdatePrinters")
    Events("onPrinterConnectionUpdate")

    // Enables the module to be used as a native view. Definition components that are accepted as part of the
    // view definition: Prop, Events.
    View(ReactNativeSunmiCloudPrinterView.self) {
      // Defines a setter for the `name` prop.
      Prop("name") { (view: ReactNativeSunmiCloudPrinterView, prop: String) in
        print(prop)
      }
    }
    
    // -----------------------------
    // Sunmi ePOS SDK public methods
    // -----------------------------
    
    Function("setTimeout") { (timeout: Float) in
      sunmiManager.setTimeout(timeout)
    }
    
    AsyncFunction("discoverPrinters") { (interface: String, promise: Promise) in
      guard let printerInterface = PrinterInterface(rawValue: interface) else {
        promise.reject(SunmiPrinterError.invalidInterface(interface))
        return
      }
      
      // Subscribe to the notifications sent by SunmiManager
      sunmiManager.delegate = self
      
      sunmiManager.discoverPrinters(printerInterface: printerInterface, promise: promise)
    }
    
    AsyncFunction("connectLanPrinter") { (ipAddress: String, promise: Promise) in
      sunmiManager.connectLanPrinter(ipAddress: ipAddress, promise: promise)
    }
    
    AsyncFunction("disconnectLanPrinter") { (promise: Promise) in
      sunmiManager.disconnectLanPrinter(promise: promise)
    }
    
    AsyncFunction("isLanConnected") { (promise: Promise) in
      sunmiManager.isLanConnected(promise: promise)
    }
    
    AsyncFunction("isBluetoothConnected") { (promise: Promise) in
      sunmiManager.isBluetoothConnected(promise: promise)
    }
    
    // Low level API methods
    
    /**
     * This function advance paper by n lines in the command buffer
     */
    AsyncFunction("lineFeed") { (lines: Int32, promise: Promise) in
      sunmiManager.lineFeed(lines: lines, promise: promise)
    }
    
    /**
     * This function set the text alignment in the command buffer
     */
    AsyncFunction("setTextAlign") { (alignment: Int, promise: Promise) in
      sunmiManager.setTextAlign(alignment: alignment, promise: promise)
    }
    
    /**
     * This function set the print mode in the command buffer
     */
    AsyncFunction("setPrintModesBold") { (bold: Bool, doubleHeight: Bool, doubleWidth: Bool, promise: Promise) in
      sunmiManager.setPrintModesBold(bold: bold, doubleHeight: doubleHeight, doubleWidth: doubleWidth, promise: promise)
    }
    
    /**
     * This function restores the printer's default settings
     */
    AsyncFunction("restoreDefaultSettings") { (promise: Promise) in
      sunmiManager.restoreDefaultSettings(promise: promise)
    }
    
    /**
     * This function restores the default line spacing
     */
    AsyncFunction("restoreDefaultLineSpacing") { (promise: Promise) in
      sunmiManager.restoreDefaultLineSpacing(promise: promise)
    }
    
    /**
     * This function adds a cut command to the command buffer.
     * True for full cut, False for partial cut
     */
    AsyncFunction("addCut") { (fullCut: Bool, promise: Promise) in
      sunmiManager.addCut(fullCut: fullCut, promise: promise)
    }
    
    /**
     * This function adds a text command to the command buffer.
     */
    AsyncFunction("addText") { (text: String, promise: Promise) in
      sunmiManager.addText(text: text, promise: promise)
    }
    
    /**
     * This function adds an image command to the command buffer.
     */
    AsyncFunction("addImage") { (base64: String, imageWidth: Int, imageHeight: Int, promise: Promise) in
      sunmiManager.addImage(base64: base64, imageWidth: imageWidth, imageHeight: imageHeight, promise: promise)
    }
    
    /**
     * This function clears the command buffer.
     */
    AsyncFunction("clearBuffer") { (promise: Promise) in
      sunmiManager.clearBuffer(promise: promise)
    }
    
    /**
     * This function sends the data in the command buffer to the printer.
     */
    AsyncFunction("sendData") { (promise: Promise) in
      sunmiManager.sendData(promise: promise)
    }
    
  }
}

extension ReactNativeSunmiCloudPrinterModule: SunmiManagerDelegate {
  func didUpdateDevices(list: [SunmiDevice]) {
    printDebugLog("notification: did update the list of devices...\(list.count) [onUpdatePrinters]")
    sendEvent("onUpdatePrinters", [
      "printers": list.map { $0.toDictionary() }
    ])
  }
  
  func didConnectPrinter() {
    printDebugLog("notification: did connect printer [onPrinterConnectionUpdate]")
    sendEvent("onPrinterConnectionUpdate", [
      "connected": true
    ])
  }
  
  func didDisconnectPrinter() {
    printDebugLog("notification: did disconnect printer [onPrinterConnectionUpdate]")
    sendEvent("onPrinterConnectionUpdate", [
      "connected": false
    ])
  }
}
