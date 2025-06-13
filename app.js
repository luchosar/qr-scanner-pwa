document.addEventListener('DOMContentLoaded', () => {
    const resultText = document.getElementById('result-text');
    const startScanBtn = document.getElementById('start-scan');
    const qrReaderDiv = document.getElementById('qr-reader');
    let qrScanner = null;
    let scanCompleted = false;

    function onScanSuccess(decodedText, decodedResult) {
        if (scanCompleted) return;
        scanCompleted = true;
        resultText.textContent = decodedText;
        resultText.className = 'success';
        qrScanner.clear().then(() => {
        }).catch(error => {
            console.error("Error liberando cámara:", error);
        });
    }

    function onScanFailure(error) {
        if (!scanCompleted) {
            resultText.textContent = '❌ No se detectó ningún código QR.';
            resultText.className = 'error';
        }
    }

    function startScan() {
        if (qrScanner) {
            qrScanner.clear().catch(() => {});
        }
        qrReaderDiv.innerHTML = "";
        qrScanner = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: 250,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
            aspectRatio: 1,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            facingMode: { exact: "environment" }
        }, false);
        scanCompleted = false;
        startScanBtn.style.display = "none";
        qrScanner.render(onScanSuccess, onScanFailure);
    }

    startScanBtn.addEventListener('click', () => {
        startScan();
    });

    // Oculta el escáner al inicio
    startScanBtn.style.display = "";
    qrReaderDiv.innerHTML = "";
});