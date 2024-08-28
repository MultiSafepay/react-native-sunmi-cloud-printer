package expo.modules.sunmicloudprinter

object PrinterConnectionNotifier {
    private val observers = mutableListOf<(connected: Boolean) -> Unit>()

    fun registerObserver(observer: (connected: Boolean) -> Unit) {
        observers.add(observer)
    }

    fun deregisterObserver(observer: (connected: Boolean) -> Unit) {
        observers.remove(observer)
    }

    fun onPrinterConnectionUpdate(connected: Boolean) {
        // Notify all observers
        observers.forEach {
            it(connected)
        }
    }
}