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
//const val PRINTER_CONNECTION_UPDATE_EVENT_NAME = "onPrinterConnectionUpdate"

class ReactNativeSunmiCloudPrinterModule : Module() {

  private val context get() = requireNotNull(appContext.reactContext)
  private var sunmiManager = SunmiManager()

  private var observer: (devices: List<CloudPrinter>) -> Unit = {}

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeSunmiCloudPrinter')` in JavaScript.
    Name("ReactNativeSunmiCloudPrinter")

    // Defines event names that the module can send to JavaScript.
    Events(UPDATE_PRINTERS_EVENT_NAME)
    //Events(PRINTER_CONNECTION_UPDATE_EVENT_NAME)

    OnCreate {
      observer = {
        printDebugLog("notification: did update the list of devices...{${it.count()}} [onUpdatePrinters]")
        val printers = it.map { element -> element.toDictionary() }
        val result = bundleOf("printers" to printers)
        this@ReactNativeSunmiCloudPrinterModule.sendEvent(UPDATE_PRINTERS_EVENT_NAME, result)
      }
      Notifier.registerObserver(observer)
    }

    OnDestroy {
      Notifier.deregisterObserver(observer)
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ReactNativeSunmiCloudPrinterView::class) {
      // Defines a setter for the `name` prop.
      Prop("name") { view: ReactNativeSunmiCloudPrinterView, prop: String ->
        println(prop)
      }
    }

    fun sendCustomEvents(name: String, body: Map<String, Any?>) {
      printDebugLog("will send events: ${name}, ${body}")
    }

    // -----------------------------
    // Sunmi ePOS SDK public methods
    // -----------------------------
    Function("setTimeout") { timeout: Long ->
      sunmiManager.setTimeout(timeout)
    }

    AsyncFunction("discoverPrinters") Coroutine { value: String ->
      Log.d(SDK_TAG, "discoverPrinters")
      val printerInterface = PrinterInterface.valueOf(value)
      return@Coroutine sunmiManager.discoverPrinters(context, printerInterface)
    }

    AsyncFunction("connectLanPrinter") { ipAddress: String, promise: Promise ->
      Log.d(SDK_TAG, "connectLanPrinter")
    }

    AsyncFunction("disconnectLanPrinter") { promise: Promise ->
      Log.d(SDK_TAG, "disconnectLanPrinter")
    }

    AsyncFunction("connectBluetoothPrinter") { uuid: String, promise: Promise ->
      Log.d(SDK_TAG, "connectBluetoothPrinter")
    }

    AsyncFunction("disconnectBluetoothPrinter") { promise: Promise ->
      Log.d(SDK_TAG, "disconnectBluetoothPrinter")
    }

    AsyncFunction("isLanConnected") { promise: Promise ->
      Log.d(SDK_TAG, "isLanConnected")
    }

    AsyncFunction("isBluetoothConnected") { promise: Promise ->
      Log.d(SDK_TAG, "isBluetoothConnected")
    }

    // Low level API methods

    /**
     * This function advance paper by n lines in the command buffer
     */
    AsyncFunction("lineFeed") { lines: Int, promise: Promise ->
      Log.d(SDK_TAG, "lineFeed")
    }

    /**
     * This function set the text alignment in the command buffer
     */
    AsyncFunction("setTextAlign") { aling: Int, promise: Promise ->
      Log.d(SDK_TAG, "setTextAlign")
    }

    /**
     * This function set the print mode in the command buffer
     */
    AsyncFunction("setPrintModesBold") { bold: Boolean, doubleHeight: Boolean, doubleWidth: Boolean, promise: Promise ->
      Log.d(SDK_TAG, "setPrintModesBold")
    }

    /**
     * This function restores the printer's default settings
     */
    AsyncFunction("restoreDefaultSettings") { promise: Promise ->
      Log.d(SDK_TAG, "restoreDefaultSettings")
    }

    /**
     * This function restores the default line spacing
     */
    AsyncFunction("restoreDefaultLineSpacing") { promise: Promise ->
      Log.d(SDK_TAG, "restoreDefaultLineSpacing")
    }

    /**
     * This function adds a cut command to the command buffer.
     * True for full cut, False for partial cut
     */
    AsyncFunction("addCut") { fullCut: Boolean, promise: Promise ->
      Log.d(SDK_TAG, "addCut")
    }

    /**
     * This function adds a text command to the command buffer.
     */
    AsyncFunction("addText") { text: String, promise: Promise ->
      Log.d(SDK_TAG, "addText")
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
      Log.d(SDK_TAG, "addImage")
    }

    /**
     * This function clears the command buffer.
     */
    AsyncFunction("clearBuffer") { promise: Promise ->
      Log.d(SDK_TAG, "clearBuffer")
    }

    /**
     * This function sends the data in the command buffer to the printer.
     */
    AsyncFunction("sendData") { promise: Promise ->
      Log.d(SDK_TAG, "sendData")
    }

    /**
     * This function opens the cash drawer connected to the printer.
     */
    AsyncFunction("openCashDrawer") { promise: Promise ->
      Log.d(SDK_TAG, "openCashDrawer")
    }

  }
}
