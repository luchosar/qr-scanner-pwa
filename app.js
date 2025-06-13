document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const resultText = document.getElementById('result-text');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        resultText.textContent = "Procesando imagen...";
        resultText.className = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new window.Image();
            img.style.display = 'none'; // Oculto
            img.onload = async () => {
                try {
                    const codeReader = new ZXing.BrowserQRCodeReader();
                    const result = await codeReader.decodeFromImageElement(img);
                    if (result && result.text) {
                        resultText.textContent = result.text;
                        resultText.className = 'success';
                    } else {
                        resultText.textContent = '❌ No se detectó ningún código QR en la imagen.';
                        resultText.className = 'error';
                    }
                } catch (err) {
                    resultText.textContent = '❌ No se detectó ningún código QR en la imagen.';
                    resultText.className = 'error';
                }
                // Limpieza: elimina el <img> oculto del DOM
                if (img.parentNode) img.parentNode.removeChild(img);
            };
            img.onerror = () => {
                resultText.textContent = 'Error al cargar la imagen';
                resultText.className = 'error';
            };
            img.src = event.target.result;
            // Necesario para decodeFromImageElement: el elemento debe estar en el DOM
            document.body.appendChild(img);
        };
        reader.onerror = () => {
            resultText.textContent = 'Error al leer el archivo de imagen';
            resultText.className = 'error';
        };
        reader.readAsDataURL(file);
    });
});