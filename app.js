// app.js - RaceLoomApp QR y Firestore

// --- Configuración Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDBPYmTzZMiOAXo0eWb5jpui1gTCd_3PDs",
    authDomain: "raceloomapp.firebaseapp.com",
    databaseURL: "https://raceloomapp-default-rtdb.firebaseio.com",
    projectId: "raceloomapp",
    storageBucket: "raceloomapp.appspot.com",
    messagingSenderId: "1084059171329",
    appId: "1:1084059171329:web:a08785530426c0724e1e00",
    measurementId: "G-PSWH06CWFE"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Variables de UI ---
const startScanBtn = document.getElementById('start-scan');
const qrReaderDiv = document.getElementById('qr-reader');
const resultText = document.getElementById('result-text');
const autoSelector = document.getElementById('auto-selector');
const autoPiezasList = document.getElementById('auto-piezas-list');
let qrScanner = null;
let scanCompleted = false;

// --- Utilidad: Map tipo de pieza ---
const tipoMap = { '1': 'chasis', '2': 'motor', '3': 'transmision' };

// --- Cargar autos y piezas al iniciar ---
let piezasPorAuto = {};
let piezasData = {};
db.collection("Piezas").get().then((querySnapshot) => {
    const autosSet = new Set();
    querySnapshot.forEach(doc => {
        const data = doc.data();
        piezasData[doc.id] = data;
        if (data.auto_id) {
            autosSet.add(data.auto_id);
            if (!piezasPorAuto[data.auto_id]) piezasPorAuto[data.auto_id] = [];
            piezasPorAuto[data.auto_id].push({ id: doc.id, ...data });
        }
    });
    autoSelector.innerHTML = '<option value="">Selecciona un auto...</option>' +
        Array.from(autosSet).map(auto => `<option value="${auto}">${auto}</option>`).join('');
});

// --- Mostrar piezas por auto seleccionado ---
autoSelector.addEventListener('change', function() {
    const auto = autoSelector.value;
    autoPiezasList.innerHTML = '';
    if (auto && piezasPorAuto[auto]) {
        const tipos = ['chasis', 'motor', 'transmision'];
        const piezasPorTipo = { chasis: [], motor: [], transmision: [] };
        piezasPorAuto[auto].forEach(pieza => {
            const tipo = (pieza.tipo || '').toLowerCase();
            if (tipos.includes(tipo)) piezasPorTipo[tipo].push(pieza);
        });
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
                    mostrarDatosPieza(pieza.id, pieza);
                };
                col.appendChild(btn);
            });
            grid.appendChild(col);
        });
        autoPiezasList.appendChild(grid);
    }
});

// --- Escaneo QR ---
startScanBtn.addEventListener('click', function() {
    if (qrScanner) qrScanner.clear().catch(() => {});
    qrReaderDiv.innerHTML = '';
    scanCompleted = false;
    resultText.textContent = 'Escanea el código de la pieza...';
    resultText.className = '';
    qrScanner = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: 250, aspectRatio: 1.0, facingMode: "user" };
    qrScanner.start(
        { facingMode: "user" },
        config,
        (decodedText, decodedResult) => {
            if (scanCompleted) return;
            scanCompleted = true;
            qrScanner.stop().then(() => { qrReaderDiv.innerHTML = ''; });
            buscarOPedirCrearPieza(decodedText);
        },
        (error) => {}
    ).catch(err => {
        resultText.textContent = 'No se pudo acceder a la cámara: ' + err;
        resultText.className = 'error';
    });
});

// --- Buscar pieza o crear si no existe ---
function buscarOPedirCrearPieza(decodedText) {
    resultText.textContent = 'Buscando pieza...';
    db.collection("Piezas").doc(decodedText).get().then((doc) => {
        if (doc.exists) {
            mostrarDatosPieza(decodedText, doc.data());
        } else {
            // Preguntar en qué auto crearla
            const autoOptions = Array.from(autoSelector.options).filter(opt => opt.value);
            if (autoOptions.length === 0) {
                resultText.innerHTML = '<span style="color:#f33">No hay autos disponibles para asignar esta pieza.</span>';
                resultText.className = 'error';
                return;
            }
            resultText.innerHTML = `<span style='font-size:1.1em;color:#ff0;'>🆕 Código nuevo:</span><br><b>${decodedText}</b>
                <div style='margin:12px 0'>Selecciona el auto donde crear la pieza:<br>
                <select id='select-auto-crear' style='margin-top:6px;'>${autoOptions.map(opt=>`<option value='${opt.value}'>${opt.text}</option>`).join('')}</select></div>
                <button id='confirmar-crear-pieza' class='upload-button' style='width:auto;'>Crear pieza</button>`;
            document.getElementById('confirmar-crear-pieza').onclick = function() {
                const auto_id = document.getElementById('select-auto-crear').value;
                const tipo = tipoMap[decodedText.charAt(0)] || '';
                const nuevo = {
                    creado: obtenerFechaHoy(),
                    tipo: tipo,
                    estado: true,
                    auto_id: auto_id
                };
                db.collection("Piezas").doc(decodedText).set(nuevo).then(() => {
                    mostrarDatosPieza(decodedText, nuevo);
                    // Actualizar en memoria y UI
                    if (!piezasPorAuto[auto_id]) piezasPorAuto[auto_id] = [];
                    piezasPorAuto[auto_id].push({ id: decodedText, ...nuevo });
                    piezasData[decodedText] = nuevo;
                    autoSelector.dispatchEvent(new Event('change'));
                }).catch((err) => {
                    resultText.innerHTML = `<span style='color:#f33;'>Error creando pieza: ${err}</span>`;
                });
            };
        }
    }).catch((error) => {
        resultText.innerHTML = `<span style='color:#f33;'>Error buscando pieza: ${error}</span>`;
    });
}

// --- Mostrar datos de pieza en lista ---
function mostrarDatosPieza(id, data) {
    let html = `<span style='font-size:1.1em;color:#0f0;'>✅ Código encontrado:</span><br><b>${id}</b><div class='data-list'>`;
    Object.entries(data).forEach(([key, value]) => {
        html += `<div class='data-item'><span class='data-key'>${key}:</span> <span class='data-value'>${value}</span></div>`;
    });
    html += `</div>`;
    resultText.innerHTML = html;
    resultText.className = 'success';
}

// --- Utilidad: Fecha de hoy DD/MM/YYYY ---
function obtenerFechaHoy() {
    const now = new Date();
    return `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`;
}
