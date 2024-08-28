package expo.modules.sunmicloudprinter

import com.sunmi.externalprinterlibrary2.printer.CloudPrinter

object Notifier {
    private val observers = mutableListOf<(devices: List<CloudPrinter>) -> Unit>()

    fun registerObserver(observer: (devices: List<CloudPrinter>) -> Unit) {
        observers.add(observer)
    }

    fun deregisterObserver(observer: (devices: List<CloudPrinter>) -> Unit) {
        observers.remove(observer)
    }

    fun onUpdatePrinters(devices: List<CloudPrinter>) {
        // Notify all observers
        observers.forEach {
            it(devices)
        }
    }
}