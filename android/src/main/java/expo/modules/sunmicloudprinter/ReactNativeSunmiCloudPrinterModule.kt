package expo.modules.sunmicloudprinter

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.core.os.bundleOf
import com.sunmi.externalprinterlibrary2.printer.CloudPrinter
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.sunmicloudprinter.SunmiManager.Companion.printDebugLog

const val UPDATE_PRINTERS_EVENT_NAME = "onUpdatePrinters"
const val PRINTER_CONNECTION_UPDATE_EVENT_NAME = "onPrinterConnectionUpdate"

class ReactNativeSunmiCloudPrinterModule : Module() {

  private val context get() = requireNotNull(appContext.reactContext)
  private var sunmiManager = SunmiManager()

  private var printersObserver: (devices: List<CloudPrinter>) -> Unit = {}
  private var printerConnectionObserver: (connected: Boolean) -> Unit = {}

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeSunmiCloudPrinter')` in JavaScript.
    Name("ReactNativeSunmiCloudPrinter")

    // Defines event names that the module can send to JavaScript.
    Events(UPDATE_PRINTERS_EVENT_NAME, PRINTER_CONNECTION_UPDATE_EVENT_NAME)

    OnCreate {
      printersObserver = {
        printDebugLog("notification: did update the list of devices...{${it.count()}} [onUpdatePrinters]")
        val printers = it.map { element -> element.toDictionary() }
        val result = bundleOf("printers" to printers)
        this@ReactNativeSunmiCloudPrinterModule.sendEvent(UPDATE_PRINTERS_EVENT_NAME, result)
      }
      PrintersNotifier.registerObserver(printersObserver)

      printerConnectionObserver = {
        val message = if (it)  "did connect printer" else "did disconnect printer"
        printDebugLog("notification: ${message} [onPrinterConnectionUpdate]")
        val result = bundleOf("connected" to it)
        this@ReactNativeSunmiCloudPrinterModule.sendEvent(PRINTER_CONNECTION_UPDATE_EVENT_NAME, result)
      }
      PrinterConnectionNotifier.registerObserver(printerConnectionObserver)
    }

    OnDestroy {
      PrintersNotifier.deregisterObserver(printersObserver)
      PrinterConnectionNotifier.deregisterObserver(printerConnectionObserver)
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ReactNativeSunmiCloudPrinterView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: ReactNativeSunmiCloudPrinterView, prop: String ->
        println(prop)
      }
    }

    // -----------------------------
    // Sunmi ePOS SDK public methods
    // -----------------------------

    Function("setTimeout") { timeout: Long ->
      sunmiManager.setTimeout(timeout)
    }

    AsyncFunction("discoverPrinters")  { value: String, promise: Promise ->
      val printerInterface = PrinterInterface.valueOf(value)
      sunmiManager.discoverPrinters(context, printerInterface, promise)
    }

    AsyncFunction("disconnectPrinter") { promise: Promise ->
      sunmiManager.disconnectPrinter(context, promise)
    }

    AsyncFunction("isPrinterConnected") { promise: Promise ->
      sunmiManager.isPrinterConnected(promise)
    }

    AsyncFunction("checkBluetoothPermissions") { promise: Promise ->
      sunmiManager.checkBluetoothPermissions(context, promise)
    }

    AsyncFunction("connectLanPrinter") { ipAddress: String, force: Boolean, promise: Promise ->
      sunmiManager.connectLanPrinter(context, force, ipAddress, promise)
    }

    AsyncFunction("connectBluetoothPrinter") { uuid: String, promise: Promise ->
      sunmiManager.connectBluetoothPrinter(context, uuid, promise)
    }

    AsyncFunction("connectUSBPrinter") { name: String, promise: Promise ->
      sunmiManager.connectUSBPrinter(context, name, promise)
    }

    // Low level API methods

    /**
     * This function advance paper by n lines in the command buffer
     */
    AsyncFunction("lineFeed") { lines: Int, promise: Promise ->
      sunmiManager.lineFeed(lines, promise)
    }

    /**
     * This function set the text alignment in the command buffer
     */
    AsyncFunction("setTextAlign") { align: Int, promise: Promise ->
      sunmiManager.setTextAlign(align, promise)
    }

    /**
     * This function set the print mode in the command buffer
     */
    AsyncFunction("setPrintModesBold") { bold: Boolean, doubleHeight: Boolean, doubleWidth: Boolean, promise: Promise ->
      sunmiManager.setPrintModesBold(bold, doubleHeight, doubleWidth, promise)
    }

    /**
     * This function restores the printer's default settings
     */
    AsyncFunction("restoreDefaultSettings") { promise: Promise ->
      sunmiManager.restoreDefaultSettings(promise)
    }

    /**
     * This function restores the default line spacing
     */
    AsyncFunction("restoreDefaultLineSpacing") { promise: Promise ->
      sunmiManager.restoreDefaultLineSpacing(promise)
    }

    /**
     * This function adds a cut command to the command buffer.
     * True for full cut, False for partial cut
     */
    AsyncFunction("addCut") { fullCut: Boolean, promise: Promise ->
      sunmiManager.addCut(fullCut, promise)
    }

    /**
     * This function adds a text command to the command buffer.
     */
    AsyncFunction("addText") { text: String, promise: Promise ->
      sunmiManager.addText(text, promise)
    }

    /**
     * This function adds an image command to the command buffer.
     */
    AsyncFunction("addImage") { base64: String, imageWidth: Int, imageHeight: Int, promise: Promise ->
      val decodedString: ByteArray = Base64.decode(base64, Base64.DEFAULT)
      val bitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)

      if (bitmap == null) {
        promise.reject(CodedException("Did fail to decode image"))
      }
      sunmiManager.addImage(bitmap, promise)
    }

    /**
     * This function clears the command buffer.
     */
    AsyncFunction("clearBuffer") { promise: Promise ->
      sunmiManager.clearBuffer(promise)
    }

    /**
     * This function sends the data in the command buffer to the printer.
     */
    AsyncFunction("sendData") { promise: Promise ->
      sunmiManager.sendData(promise)
    }

    /**
     * This function opens the cash drawer connected to the printer.
     */
    AsyncFunction("openCashDrawer") { promise: Promise ->
      sunmiManager.openCashDrawer(promise)
    }

    AsyncFunction("getPrinterStatus") { promise: Promise ->
      sunmiManager.getDeviceState(promise)
    }

  }
}
