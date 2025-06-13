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
    const autoSelector = document.getElementById('auto-selector');
    const autoPiezasList = document.getElementById('auto-piezas-list');
    let piezasPorAuto = {};
    let piezasData = {};
    // Cargar autos únicos y piezas al iniciar
    db.collection("Piezas").get().then((querySnapshot) => {
        const autosSet = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            piezasData[doc.id] = data;
            if (data.auto_id) {
                autosSet.add(data.auto_id);
                if (!piezasPorAuto[data.auto_id]) piezasPorAuto[data.auto_id] = [];
                piezasPorAuto[data.auto_id].push({id: doc.id, ...data});
            }
        });
        // Llenar selector
        autoSelector.innerHTML = '<option value="">Selecciona un auto...</option>' +
            Array.from(autosSet).map(auto => `<option value="${auto}">${auto}</option>`).join('');
    });
    // Mostrar piezas cuando se selecciona un auto
    autoSelector.addEventListener('change', function() {
    const auto = autoSelector.value;
    autoPiezasList.innerHTML = '';
    if (auto && piezasPorAuto[auto]) {
        // Agrupar piezas por tipo
        const tipos = ['chasis', 'motor', 'transmision'];
        const piezasPorTipo = { chasis: [], motor: [], transmision: [] };
        piezasPorAuto[auto].forEach(pieza => {
            const tipo = (pieza.tipo || '').toLowerCase();
            if (tipos.includes(tipo)) {
                piezasPorTipo[tipo].push(pieza);
            }
        });
        // Crear contenedores de columna
        const grid = document.createElement('div');
        grid.className = 'piezas-grid';
        tipos.forEach(tipo => {
            const col = document.createElement('div');
            col.className = 'piezas-col';
            const title = document.createElement('div');
            title.className = 'piezas-col-title';
            title.textContent = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            col.appendChild(title);
            piezasPorTipo[tipo].forEach(pieza => {
                const btn = document.createElement('button');
                btn.className = 'pieza-btn';
                btn.textContent = pieza.id;
                btn.onclick = function() {
                    let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Pieza encontrada:</span><br><b>${pieza.id}</b><div class='data-list'>`;
                    Object.entries(pieza).forEach(([key, value]) => {
                        html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
                    });
                    html += `</div>`;
                    resultText.innerHTML = html;
                    resultText.className = 'success';
                    startScanBtn.disabled = false;
                    startScanBtn.style.display = "";
                };
                col.appendChild(btn);
            });
            grid.appendChild(col);
        });
        autoPiezasList.appendChild(grid);
    }
});
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
                    // Muestra los datos como lista visual
                    let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Código encontrado:</span><br><b>${decodedText}</b><div class='data-list'>`;
                    Object.entries(data).forEach(([key, value]) => {
                        html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
                    });
                    html += `</div>`;
                    resultText.innerHTML = html;
                    resultText.className = 'success';
                    startScanBtn.disabled = false;
                    startScanBtn.style.display = "";
                } else {
                    // Si no existe, pregunta en qué auto crearla
                    const now = new Date();
                    const tipoMap = { '1': 'chasis', '2': 'motor', '3': 'transmision' };
                    const tipo = tipoMap[decodedText.charAt(0)] || '';

                    // Mostrar selector de autos
                    const resultHtml = [];
                    resultHtml.push(`<span style='font-size:1.1em;color:#ff0;'>🆕 Código nuevo:</span><br><b>${decodedText}</b>`);
                    // Obtener autos del selector existente
                    const autoSelector = document.getElementById('auto-selector');
                    const autoOptions = Array.from(autoSelector.options).filter(opt => opt.value);
                    if (autoOptions.length === 0) {
                        resultText.innerHTML = '<span style="color:#f33">No hay autos disponibles para asignar esta pieza.</span>';
                        resultText.className = 'error';
                        startScanBtn.disabled = false;
                        startScanBtn.style.display = "";
                        return;
                    }
                    resultHtml.push('<div style="margin:12px 0">Selecciona el auto donde crear la pieza:<br>');
                    resultHtml.push('<select id="select-auto-crear" style="margin-top:6px;">' + autoOptions.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('') + '</select>');
                    resultHtml.push('</div>');
                    resultHtml.push('<button id="confirmar-crear-pieza" class="upload-button" style="width:auto;">Crear pieza</button>');
                    resultText.innerHTML = resultHtml.join('');
                    resultText.className = '';
                    // Esperar confirmación del usuario
                    document.getElementById('confirmar-crear-pieza').onclick = function() {
                        const auto_id = document.getElementById('select-auto-crear').value;
                        const nuevo = {
                            creado: `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`,
                            tipo: tipo,
                            estado: true,
                            auto_id: auto_id
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
                                        // Muestra los datos actualizados en lista visual, sin comillas
                                        let updated = { ...nuevo, kilometros, nota };
                                        let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Código actualizado:</span><br><b>${decodedText}</b><div class='data-list'>`;
                                        Object.entries(updated).forEach(([key, value]) => {
                                            html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
                                        });
                                        html += `</div>`;
                                        resultText.innerHTML = html;
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
                    };
                }

                        form.style.display = '';
                        form.kilometros.value = '';
                        form.nota.value = '';
                        form.onsubmit = function(e) {
                            e.preventDefault();
                            const kilometros = parseFloat(form.kilometros.value);
                            const nota = form.nota.value.trim();
                            db.collection("Piezas").doc(decodedText).update({ kilometros, nota })
                            .then(() => {
                                // Muestra los datos actualizados en lista visual, sin comillas
                                let updated = { ...nuevo, kilometros, nota };
                                let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Código actualizado:</span><br><b>${decodedText}</b><div class='data-list'>`;
                                Object.entries(updated).forEach(([key, value]) => {
                                    html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
                                });
                                html += `</div>`;
                                resultText.innerHTML = html;
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

    // Búsqueda manual por código
    const manualInput = document.getElementById('manual-search-input');
    const manualBtn = document.getElementById('manual-search-btn');
    function manualSearchHandler() {
        const code = manualInput.value.trim();
        if (!code) return;
        manualInput.value = '';
        scanCompleted = false;
        // Reutiliza la lógica de búsqueda, pero sin escanear
        resultText.innerText = "Buscando en la base de datos...";
        resultText.className = '';
        db.collection("Piezas").doc(code).get()
            .then((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Código encontrado:</span><br><b>${code}</b><div class='data-list'>`;
                    Object.entries(data).forEach(([key, value]) => {
                        html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
                    });
                    html += `</div>`;
                    resultText.innerHTML = html;
                    resultText.className = 'success';
                    startScanBtn.disabled = false;
                    startScanBtn.style.display = "";
                } else {
                    resultText.innerHTML = `<span style='font-size:1.1em;color:#ff0;'>⚠️ Código no encontrado:</span><br><b>${code}</b>`;
                    resultText.className = 'error';
                    startScanBtn.disabled = false;
                    startScanBtn.style.display = "";
                }
            })
            .catch((error) => {
                resultText.innerText = `Error al buscar en Firestore: ${error}`;
                resultText.className = 'error';
                startScanBtn.disabled = false;
                startScanBtn.style.display = "";
            });
    }
    manualBtn.addEventListener('click', manualSearchHandler);
    manualInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            manualSearchHandler();
        }
    });

    // Oculta el escáner al inicio
    startScanBtn.disabled = false;
    startScanBtn.style.display = "";
    qrReaderDiv.innerHTML = "";
