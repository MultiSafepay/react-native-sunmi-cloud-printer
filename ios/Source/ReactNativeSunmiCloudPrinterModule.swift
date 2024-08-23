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
  }
}

extension ReactNativeSunmiCloudPrinterModule: SunmiManagerDelegate {
  func didUpdateDevices(list: [SunmiDevice]) {
    printDebugLog("did update the list of devices...\(list.count) [onUpdatePrinters]")
    sendEvent("onUpdatePrinters", [
      "printers": list.map { $0.toDictionary() }
    ])
  }
}
