document.addEventListener('DOMContentLoaded', () => {
    const resultText = document.getElementById('result-text');
    
    function onScanSuccess(decodedText, decodedResult) {
        resultText.textContent = decodedText;
        resultText.className = 'success';
    }

    function onScanFailure(error) {
        resultText.textContent = '❌ No se detectó ningún código QR.';
        resultText.className = 'error';
    }

    const qrScanner = new Html5QrcodeScanner("qr-reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        aspectRatio: 1
    }, false);

    qrScanner.render(onScanSuccess, onScanFailure);
});