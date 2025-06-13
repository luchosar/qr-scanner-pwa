// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDBPYmTzZMiOAXo0eWb5jpui1gTCd_3PDs",
    authDomain: "raceloomapp.firebaseapp.com",
    databaseURL: "https://raceloomapp-default-rtdb.firebaseio.com",
    projectId: "raceloomapp",
    storageBucket: "raceloomapp.firebasestorage.app",
    messagingSenderId: "1084059171329",
    appId: "1:1084059171329:web:a08785530426c0724e1e00",
    measurementId: "G-PSWH06CWFE"
};

// Inicializa Firebase solo si no está inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    const resultText = document.getElementById('result-text');
    const startScanBtn = document.getElementById('start-scan');
    const qrReaderDiv = document.getElementById('qr-reader');
    let qrScanner = null;
    let scanCompleted = false;

    function onScanSuccess(decodedText, decodedResult) {
        if (scanCompleted) return;
        scanCompleted = true;
        resultText.textContent = "Buscando en la base de datos...";
        resultText.className = '';

        qrScanner.clear().then(() => {}).catch(() => {});

        // Busca el código en Firestore (colección 'codigos', documento con ID igual al código leído)
        db.collection("codigos").doc(decodedText).get()
            .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                resultText.textContent = `✅ Código encontrado: ${decodedText}\n\n${JSON.stringify(data, null, 2)}`;
                resultText.className = 'success';
            } else {
                resultText.textContent = `❌ Código no encontrado en la base de datos.`;
                resultText.className = 'error';
            }
            // Habilita el botón para volver a escanear
            startScanBtn.disabled = false;
            startScanBtn.style.display = "";
            })
            .catch((error) => {
            resultText.textContent = `Error al buscar en Firestore: ${error}`;
            resultText.className = 'error';
            startScanBtn.disabled = false;
            startScanBtn.style.display = "";
            });
    }

    function onScanFailure(error) {
        if (!scanCompleted) {
            resultText.textContent = '❌ No se detectó ningún código QR.';
            resultText.className = 'error';
            startScanBtn.disabled = false;
            startScanBtn.style.display = "";
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
        startScanBtn.disabled = true;
        startScanBtn.style.display = "none";
        qrScanner.render(onScanSuccess, onScanFailure);
    }

    startScanBtn.addEventListener('click', () => {
        startScan();
    });

    // Oculta el escáner al inicio
    startScanBtn.disabled = false;
    startScanBtn.style.display = "";
    qrReaderDiv.innerHTML = "";
});