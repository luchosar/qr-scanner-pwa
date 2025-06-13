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
        resultText.innerText = "Buscando en la base de datos...";
        resultText.className = '';

        qrScanner.clear().then(() => {}).catch(() => {});

        db.collection("codigos").doc(decodedText).get()
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
                    db.collection("codigos").doc(decodedText).set(nuevo)
                        .then(() => {
                        resultText.innerHTML = `<span style='font-size:1.1em;color:#ff0;'>🆕 Código creado:</span><br><b>${decodedText}</b><pre style='background:none;color:#eee;font-size:1em;margin-top:10px;'>${JSON.stringify(nuevo, null, 2)}</pre>`;
                        resultText.className = 'success';

                        // Agrega formulario para kilometros y nota
                        const form = document.createElement('form');
                        form.style.marginTop = '16px';
                        form.innerHTML = `
                          <label style='color:#fff;'>Kilómetros: <input type='number' name='kilometros' min='0' step='0.1' style='margin-bottom:8px;'></label><br>
                          <label style='color:#fff;'>Nota: <input type='text' name='nota' maxlength='100' style='margin-bottom:8px;width:180px;'></label><br>
                          <button type='submit' class='upload-button' style='margin-top:8px;'>Guardar datos</button>
                        `;
                        resultText.appendChild(form);

                        form.onsubmit = function(e) {
                          e.preventDefault();
                          const kilometros = parseFloat(form.kilometros.value);
                          const nota = form.nota.value.trim();
                          db.collection("codigos").doc(decodedText).update({ kilometros, nota })
                            .then(() => {
                              resultText.innerHTML = `<span style='font-size:1.1em;color:#0f0;'>✅ Código actualizado:</span><br><b>${decodedText}</b><pre style='background:none;color:#eee;font-size:1em;margin-top:10px;'>${JSON.stringify({ ...nuevo, kilometros, nota }, null, 2)}</pre>`;
                            })
                            .catch((err) => {
                              resultText.innerHTML += `<div style='color:#f33;margin-top:8px;'>Error al guardar: ${err}</div>`;
                            });
                        };

                        startScanBtn.disabled = false;
                        startScanBtn.style.display = "";
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