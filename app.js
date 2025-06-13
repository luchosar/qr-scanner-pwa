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
    const firestoreStatus = document.getElementById('firestore-status');
    db.collection("Piezas").limit(1).get()
        .then(() => firestoreStatus.classList.add("ok"))
        .catch(() => firestoreStatus.classList.remove("ok"));
    const resultText = document.getElementById('result-text');
    const startScanBtn = document.getElementById('start-scan');
    const qrReaderDiv = document.getElementById('qr-reader');
    let qrScanner = null;
    let scanCompleted = false;

    function onScanSuccess(decodedText, decodedResult) {
        if (scanCompleted) return;
        scanCompleted = true;
        resultText.innerText = "Buscando en la base de datos...";
        resultText.className = '';

        qrScanner.clear().then(() => {}).catch(() => {});

        db.collection("Piezas").doc(decodedText).get()
            .then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    // Muestra el resultado en formato bonito
                    resultText.innerHTML = `<span style='font-size:1.1em;color:#0f0;'>✅ Código encontrado:</span><br><b>${decodedText}</b><pre style='background:none;color:#eee;font-size:1em;margin-top:10px;'>${JSON.stringify(data, null, 2)}</pre>`;
                    resultText.className = 'success';
                    startScanBtn.disabled = false;
                    startScanBtn.style.display = "";
                } else {
                    // Si no existe, lo crea
                    const now = new Date();
                    const nuevo = {
                        creado: now.toISOString(),
                        codigo: decodedText
                    };
                    db.collection("Piezas").doc(decodedText).set(nuevo)
                        .then(() => {
                        resultText.innerHTML = `<span style='font-size:1.1em;color:#ff0;'>🆕 Código creado:</span><br><b>${decodedText}</b><pre style='background:none;color:#eee;font-size:1em;margin-top:10px;'>${JSON.stringify(nuevo, null, 2)}</pre>`;
                        resultText.className = 'success';

                        // Muestra el formulario HTML ya existente
                        const form = document.getElementById('nuevo-codigo-form');
                        form.style.display = '';
                        form.kilometros.value = '';
                        form.nota.value = '';
                        form.onsubmit = function(e) {
                            e.preventDefault();
                            const kilometros = parseFloat(form.kilometros.value);
                            const nota = form.nota.value.trim();
                            db.collection("Piezas").doc(decodedText).update({ kilometros, nota })
                            .then(() => {
                                resultText.innerHTML = `<span style='font-size:1.1em;color:#0f0;'>✅ Código actualizado:</span><br><b>${decodedText}</b><pre style='background:none;color:#eee;font-size:1em;margin-top:10px;'>${JSON.stringify({ ...nuevo, kilometros, nota }, null, 2)}</pre>`;
                                form.style.display = 'none';
                                startScanBtn.disabled = false;
                                startScanBtn.style.display = "";
                            })
                            .catch((err) => {
                                resultText.innerHTML += `<div style='color:#f33;margin-top:8px;'>Error al guardar: ${err}</div>`;
                            });
                        };
                        // El botón solo vuelve a aparecer tras guardar
                        startScanBtn.disabled = true;
                        startScanBtn.style.display = "none";
                        })
                        .catch((err) => {
                        resultText.innerText = `Error creando el código en Firestore: ${err}`;
                        resultText.className = 'error';
                        startScanBtn.disabled = false;
                        startScanBtn.style.display = "";
                        });
                }
            })
            .catch((error) => {
                resultText.innerText = `Error al buscar en Firestore: ${error}`;
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
        resultText.innerText = "-";
        resultText.className = "";
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