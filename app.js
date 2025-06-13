document.addEventListener('DOMContentLoaded', () => {
    const resultText = document.getElementById('result-text');
    
    let scanCompleted = false;

    function onScanSuccess(decodedText, decodedResult) {
        if (scanCompleted) return;
        scanCompleted = true;
        resultText.textContent = decodedText;
        resultText.className = 'success';
        qrScanner.clear(); // Detiene el escaneo y libera la cámara
    }

    function onScanFailure(error) {
        if (!scanCompleted) {
            resultText.textContent = '❌ No se detectó ningún código QR.';
            resultText.className = 'error';
        }
    }

    const qrScanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        aspectRatio: 1,
        // Forzar cámara trasera si es posible
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        // facingMode solo funciona en algunos navegadores
        facingMode: { exact: "environment" }
    }, false);

    qrScanner.render(onScanSuccess, onScanFailure);
});