document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const startButton = document.getElementById('start-button');
    const resultText = document.getElementById('result-text');
    let stream = null;
    let scanning = false;
    let animationFrame = null;

    // Verificar compatibilidad con la API de cámara
    function checkCameraCompatibility() {
      const hasMediaDevices = !!navigator.mediaDevices;
      const hasGetUserMedia = hasMediaDevices && !!navigator.mediaDevices.getUserMedia;
      
      if (!hasGetUserMedia) {
        console.error('Navegador no soporta navigator.mediaDevices.getUserMedia');
      }
      
      return hasGetUserMedia;
    }

    // Mostrar mensaje mejorado
    if (!checkCameraCompatibility()) {
      const browserInfo = `Navegador: ${navigator.userAgent}\n` +
                         `Plataforma: ${navigator.platform}\n` +
                         `HTTPS: ${window.location.protocol === 'https:'}`;
      
      console.log('Información del navegador:', browserInfo);
      
      resultText.innerHTML = 'Error de compatibilidad con la cámara:<br><br>' +
        '• Asegúrate de usar:<br>' +
        '- Chrome 53+<br>' +
        '- Firefox 36+<br>' +
        '- Edge 79+<br><br>' +
        '• Debes acceder via HTTPS<br>' +
        '• Verifica los permisos de cámara<br><br>' +
        `Detalles técnicos:<br><small>${browserInfo.replace(/\n/g, '<br>')}</small>`;
      
      startButton.disabled = true;
      return;
    }

    // Función para iniciar el escaneo
    async function startScanning() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            video.srcObject = stream;
            await video.play();
            
            startButton.textContent = 'Detener Escaneo';
            scanning = true;
            resultText.textContent = 'Escaneando...';
            
            // Iniciar el bucle de detección
            detectQR();
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            resultText.textContent = 'Error al acceder a la cámara. Asegúrate de otorgar los permisos necesarios.';
        }
    }

    // Función para detener el escaneo
    function stopScanning() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        
        video.srcObject = null;
        startButton.textContent = 'Iniciar Escaneo';
        scanning = false;
        
        if (resultText.textContent === 'Escaneando...') {
            resultText.textContent = '-';
        }
    }

    // Función para detectar códigos QR
    function detectQR() {
        if (!scanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.hidden = false;
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            
            if (code) {
                resultText.textContent = code.data;
                // Opcional: Detener el escaneo después de encontrar un código
                // stopScanning();
            }
        }
        
        if (scanning) {
            animationFrame = requestAnimationFrame(detectQR);
        }
    }

    // Manejar el clic en el botón
    startButton.addEventListener('click', () => {
        if (scanning) {
            stopScanning();
        } else {
            startScanning();
        }
    });

    // Registrar el Service Worker para PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado con éxito:', registration.scope);
                })
                .catch(error => {
                    console.log('Error al registrar el ServiceWorker:', error);
                });
        });
    }
});
