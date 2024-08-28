package expo.modules.sunmicloudprinter

import android.content.Context
import android.util.Log
import com.sunmi.externalprinterlibrary2.SearchCallback
import com.sunmi.externalprinterlibrary2.SearchMethod
import com.sunmi.externalprinterlibrary2.SunmiPrinterManager
import com.sunmi.externalprinterlibrary2.printer.CloudPrinter
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.delay

internal object PrintingCommands {
    const val INVALID_INTERFACE = 0
    const val IMAGE_NOT_VALID = 1
    const val IMAGE_SIZE_NOT_VALID = 2
    const val PRINTER_NOT_CONNECTED = 3
    const val PRINTER_NOT_FOUND = 4
    const val PRINTER_NOT_SETUP = 5
    const val EMPTY_BUFFER = 6
}

enum class SunmiPrinterError(val error: String) {
    INVALID_INTERFACE("ERROR_INVALID_INTERFACE"),
    IMAGE_NOT_VALID("ERROR_IMAGE_NOT_VALID"),
    IMAGE_SIZE_NOT_VALID("ERROR_IMAGE_SIZE_NOT_VALID"),
    PRINTER_NOT_CONNECTED("ERROR_PRINTER_NOT_CONNECTED"),
    PRINTER_NOT_FOUND("ERROR_PRINTER_NOT_FOUND"),
    PRINTER_NOT_SETUP("ERROR_PRINTER_NOT_SETUP"),
    EMPTY_BUFFER("ERROR_EMPTY_BUFFER"),
}

class PrinterException(errorCode: SunmiPrinterError) : CodedException(errorCode.name)

enum class PrinterInterface(val interfaceName: String) {
    LAN("LAN"),
    BLUETOOTH("BLUETOOTH"),
    USB("USB");

    val method: Int
        get() = when (this) {
            LAN -> SearchMethod.LAN
            BLUETOOTH -> SearchMethod.BT
            USB -> SearchMethod.USB
        }
}

class SunmiManager: SearchCallback {

    private var timeout: Long = 5000;
    private var cloudPrinter: CloudPrinter? = null
    private var manager: SunmiPrinterManager? = null
    private var _devices: List<CloudPrinter> = emptyList()
    private var devices: List<CloudPrinter>
        get() = _devices
        set(value) {
            _devices = value
            Notifier.onUpdatePrinters(value)
        }

    init {
        manager = SunmiPrinterManager.getInstance()
    }

    fun setTimeout(timeout: Long) {
        this.timeout = timeout
    }

    suspend fun discoverPrinters(context: Context, printerInterface: PrinterInterface) {
        // Every time we trigger discover, we clear the list of devices
        devices = emptyList()

        // Search for printers
        val method = printerInterface.method
        manager?.searchCloudPrinter(context, method, this)
        printDebugLog("🟢 did start to discover printers: [interface=${printerInterface.interfaceName}]")
        delay(timeout)
        manager?.stopSearch(context, method)
        printDebugLog("🟢 did stop searching for printers after timeout: [interface=${printerInterface.interfaceName}]")
        return
    }

    override fun onFound(p0: CloudPrinter?) {
        printDebugLog("🟢 did discover a cloud printer: ${p0?.cloudPrinterInfo.toString()}")
        val incomingDeviceName = p0?.cloudPrinterInfo?.name
        val hasDevice = devices.any { device ->
            device.cloudPrinterInfo.name == incomingDeviceName
        }

        // We only include the device if we're sure the device is not already in the list
        if (!hasDevice && p0 != null) {
            devices = devices + p0
        }
    }

    companion object {
        @JvmStatic
        fun printDebugLog(message: String) {
            if (BuildConfig.DEBUG) {
                Log.d(SDK_TAG, message)
            }
        }
    }
}

fun CloudPrinter.toDictionary(): Map<String, Any?> {
    val info = this.cloudPrinterInfo
    return mapOf(
        "interface" to PrinterInterface.LAN.name,
        "name" to info.name,
        "signalStrength" to null,
        "uuid" to null,
        "ip" to info.address,
        "serialNumber" to null,
        "mode" to null
    )
}
