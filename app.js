document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('preview');
    const resultText = document.getElementById('result-text');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        resultText.textContent = "Procesando imagen...";
        
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.src = event.target.result;
            scanQRCode(event.target.result);
        };
        reader.readAsDataURL(file);
    });

    function scanQRCode(imageSrc) {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                resultText.textContent = code.data;
            } else {
                resultText.textContent = 'No se encontró ningún código QR. Intenta con otra imagen.';
            }
        };
        img.onerror = () => {
            resultText.textContent = 'Error al cargar la imagen';
        };
        img.src = imageSrc;
    }
});