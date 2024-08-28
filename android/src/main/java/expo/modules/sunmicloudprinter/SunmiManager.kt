package expo.modules.sunmicloudprinter

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import com.sunmi.externalprinterlibrary2.ConnectCallback
import com.sunmi.externalprinterlibrary2.ResultCallback
import com.sunmi.externalprinterlibrary2.SearchCallback
import com.sunmi.externalprinterlibrary2.SearchMethod
import com.sunmi.externalprinterlibrary2.SunmiPrinterManager
import com.sunmi.externalprinterlibrary2.printer.CloudPrinter
import com.sunmi.externalprinterlibrary2.style.AlignStyle
import com.sunmi.externalprinterlibrary2.style.CloudPrinterStatus
import com.sunmi.externalprinterlibrary2.style.ImageAlgorithm
import expo.modules.kotlin.Promise
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
            PrintersNotifier.onUpdatePrinters(value)
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

    fun connectLanPrinter(context: Context, ipAddress: String, promise: Promise) {
        try {
            val currentPrinter = devices.first { printer -> printer.cloudPrinterInfo.address == ipAddress }
            this.cloudPrinter = currentPrinter
            printDebugLog("🟢 will connect to printer at $ipAddress")
            currentPrinter.connect(context, object : ConnectCallback {
                override fun onConnect() {
                    PrinterConnectionNotifier.onPrinterConnectionUpdate(true)
                }

                override fun onFailed(s: String) {
                    printDebugLog("🔴 did fail to connect: $s")
                    PrinterConnectionNotifier.onPrinterConnectionUpdate(false)
                }

                override fun onDisConnect() {
                    PrinterConnectionNotifier.onPrinterConnectionUpdate(false)
                }
            })
            promise.resolve()
        } catch (error: Exception) {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_FOUND))
        }
    }

    fun disconnectLanPrinter(context: Context, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.release(context)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun isConnected(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            promise.resolve(printer.isConnected)
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    // -----------------------
    // Low Level API methods
    // -----------------------

    fun lineFeed(lines: Int, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.lineFeed(lines)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun setTextAlign(alignment: Int, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            val alignStyle: AlignStyle

            when (alignment) {
                1 -> {
                    alignStyle = AlignStyle.CENTER
                }
                2 -> {
                    alignStyle = AlignStyle.RIGHT
                }
                else -> {
                    alignStyle = AlignStyle.LEFT
                }
            }

            printer.setAlignment(alignStyle)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun setPrintModesBold(bold: Boolean, doubleHeight: Boolean, doubleWidth: Boolean, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.setBoldMode(bold)
            // doubleHeight and doubleWidth are ignored in Android
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun restoreDefaultSettings(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.restoreDefaultSettings()
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun restoreDefaultLineSpacing(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.restoreDefaultLineSpacing()
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun addCut(fullCut: Boolean, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.cutPaper(fullCut)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun addText(text: String, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.printText(text)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun addImage(bitmap: Bitmap, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.printImage(bitmap, ImageAlgorithm.DITHERING)
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun clearBuffer(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.clearTransBuffer()
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun sendData(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.commitTransBuffer(object : ResultCallback {
                override fun onComplete() {
                    promise.resolve()
                }

                override fun onFailed(p0: CloudPrinterStatus?) {
                    promise.reject(PrinterException(SunmiPrinterError.EMPTY_BUFFER))
                }
            })
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    fun openCashDrawer(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.openCashBox()
            promise.resolve()
        } else {
            promise.reject(PrinterException(SunmiPrinterError.PRINTER_NOT_CONNECTED))
        }
    }

    // -----------------------
    // SearchCallback methods
    // -----------------------

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
