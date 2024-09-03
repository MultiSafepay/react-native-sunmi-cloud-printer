package expo.modules.sunmicloudprinter

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import com.sunmi.externalprinterlibrary2.ConnectCallback
import com.sunmi.externalprinterlibrary2.ResultCallback
import com.sunmi.externalprinterlibrary2.SearchMethod
import com.sunmi.externalprinterlibrary2.SunmiPrinterManager
import com.sunmi.externalprinterlibrary2.printer.CloudPrinter
import com.sunmi.externalprinterlibrary2.style.AlignStyle
import com.sunmi.externalprinterlibrary2.style.CloudPrinterStatus
import com.sunmi.externalprinterlibrary2.style.ImageAlgorithm
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

enum class SunmiPrinterError(val error: String, val reason: String) {
    PRINTER_NOT_CONNECTED("ERROR_PRINTER_NOT_CONNECTED", "Printer not connected"),
    PRINTER_NOT_FOUND("ERROR_PRINTER_NOT_FOUND", "Printer not found"),
    EMPTY_BUFFER("ERROR_EMPTY_BUFFER", "Empty buffer"),
    ERROR_INVALID_PERMISSIONS("ERROR_INVALID_PERMISSIONS", "Invalid permissions")
}

class PrinterException(errorCode: SunmiPrinterError) : CodedException(errorCode.error)

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

class SunmiManager {

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

    fun checkBluetoothPermissions(context: Context, promise: Promise) {
        val hasPermissions = haveBluetoothPermissions(context)
        promise.resolve(hasPermissions)
    }

    fun discoverPrinters(context: Context, printerInterface: PrinterInterface, promise: Promise) = runBlocking {
        // Every time we trigger discover, we clear the list of devices
        devices = emptyList()

        val method = printerInterface.method

        // Search for printers
        val hasPermissions: Boolean
        if (printerInterface == PrinterInterface.BLUETOOTH) {
            printDebugLog("🟢 will check bluetooth permissions")
            hasPermissions = haveBluetoothPermissions(context)
        } else {
            hasPermissions = true
        }
        if (hasPermissions) {
            launch { // launch a new coroutine and continue
                printDebugLog("🟢 will discover a cloud printer: ${printerInterface.interfaceName}")
                manager?.searchCloudPrinter(context, method
                ) { p0 ->
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
                printDebugLog("🟢 did start to discover printers: [interface=${printerInterface.interfaceName}]")
                delay(timeout) // non-blocking delay for `timeout` ms
                manager?.stopSearch(context, method)
                printDebugLog("🟢 did stop searching for printers after timeout: [interface=${printerInterface.interfaceName}]")
                promise.resolve()
            }
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.ERROR_INVALID_PERMISSIONS)
        }
    }

    fun connectLanPrinter(context: Context, force: Boolean, ipAddress: String, promise: Promise) {
        connectToPrinter(context, force, PrinterInterface.LAN, ipAddress, promise)
    }

    fun connectUSBPrinter(context: Context, name: String, promise: Promise) {
        connectToPrinter(context, false, PrinterInterface.USB, name, promise)
    }

    fun connectBluetoothPrinter(context: Context, mac: String, promise: Promise) {
        connectToPrinter(context, false, PrinterInterface.BLUETOOTH, mac, promise)
    }

    fun disconnectPrinter(context: Context, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.release(context)
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun isPrinterConnected(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            promise.resolve(printer.isConnected)
        } else {
            promise.resolve(false)
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
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
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
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun setPrintModesBold(bold: Boolean, doubleHeight: Boolean, doubleWidth: Boolean, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.setBoldMode(bold)
            // doubleHeight and doubleWidth are ignored in Android
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun restoreDefaultSettings(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.restoreDefaultSettings()
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun restoreDefaultLineSpacing(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.restoreDefaultLineSpacing()
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun addCut(fullCut: Boolean, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.cutPaper(fullCut)
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun addText(text: String, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.printText(text)
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun addImage(bitmap: Bitmap, promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.printImage(bitmap, ImageAlgorithm.DITHERING)
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun clearBuffer(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.clearTransBuffer()
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
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
                    promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_FOUND)
                }
            })
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
        }
    }

    fun openCashDrawer(promise: Promise) {
        val printer = cloudPrinter
        if (printer != null) {
            printer.openCashBox()
            promise.resolve()
        } else {
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_CONNECTED)
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

    private fun haveBluetoothPermissions(context: Context): Boolean {
        val grantedPermissions: Boolean
        val fineLocationPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val bluetoothScanPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN)
            val bluetoothConnectPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT)

            grantedPermissions = fineLocationPermission == android.content.pm.PackageManager.PERMISSION_GRANTED &&
                    bluetoothScanPermission == android.content.pm.PackageManager.PERMISSION_GRANTED &&
                    bluetoothConnectPermission == android.content.pm.PackageManager.PERMISSION_GRANTED
        } else {
            grantedPermissions = fineLocationPermission == android.content.pm.PackageManager.PERMISSION_GRANTED
        }
        return grantedPermissions
    }

    private fun connectToPrinter(context: Context, force: Boolean, printerInterface: PrinterInterface, value: String, promise: Promise) {
        try {

            var currentPrinter: CloudPrinter?

            currentPrinter = devices.find { printer ->
                when (printerInterface.method) {
                    SearchMethod.BT -> printer.cloudPrinterInfo.mac == value
                    SearchMethod.USB -> printer.cloudPrinterInfo.name == value
                    else -> printer.cloudPrinterInfo.address == value
                }
            }

            if (currentPrinter == null && printerInterface.method == SearchMethod.LAN && force) {
                // Add the printer manually
                currentPrinter = SunmiPrinterManager.getInstance().createCloudPrinter(value, 9100)
                devices = devices + currentPrinter
            } else if (currentPrinter == null){
                // Printer not found
                promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_FOUND)
                return
            }

            this.cloudPrinter = currentPrinter
            printDebugLog("🟢 will connect to ${printerInterface.name} printer: $value")
            currentPrinter!!.connect(context, object : ConnectCallback {
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
            promise.rejectWithSunmiError(SunmiPrinterError.PRINTER_NOT_FOUND)
        }
    }
}

fun CloudPrinter.toDictionary(): Map<String, Any?> {
    val info = this.cloudPrinterInfo
    if (info.vid > 0 && info.pid > 0) {
        // USB printer
        return mapOf(
            "interface" to PrinterInterface.USB.name,
            "name" to info.name,
            "signalStrength" to null,
            "uuid" to null,
            "ip" to null,
            "serialNumber" to null,
            "mode" to null
        )
    } else if (info.mac != null) {
        // BLUETOOTH printer
        return mapOf(
            "interface" to PrinterInterface.BLUETOOTH.name,
            "name" to info.name,
            "signalStrength" to null,
            "uuid" to info.mac,
            "ip" to null,
            "serialNumber" to null,
            "mode" to null
        )
    }
    // LAN printer
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

fun Promise.rejectWithSunmiError(error: SunmiPrinterError) {
    reject(error.error, error.reason, null)
}