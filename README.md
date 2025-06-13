# Escáner QR PWA

Una aplicación web progresiva (PWA) simple para escanear códigos QR directamente desde el navegador.

## Características

- Escaneo de códigos QR en tiempo real
- Interfaz simple e intuitiva
- Funciona sin conexión (una vez cargada)
- Se puede instalar en dispositivos móviles y de escritorio
- Sin dependencias externas (excepto jsQR para el escaneo de códigos QR)

## Cómo usar

1. Abre el archivo `index.html` en un navegador web moderno (Chrome, Firefox, Edge, etc.)
2. Asegúrate de otorgar los permisos de cámara cuando se te solicite
3. Presiona el botón "Iniciar Escaneo"
4. Apunta la cámara hacia un código QR
5. El resultado del escaneo aparecerá en la pantalla

## Instalación como PWA

### En móviles (Android/Chrome):
1. Abre la aplicación en Chrome
2. Toca el menú de tres puntos
3. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"

### En escritorio (Chrome/Edge):
1. Abre la aplicación en Chrome o Edge
2. Haz clic en el icono de instalación en la barra de direcciones
3. Sigue las instrucciones para instalar la aplicación

## Compatibilidad

- Navegadores modernos con soporte para:
  - getUserMedia API (para acceso a la cámara)
  - Service Workers (para funcionalidad offline)
  - ES6+ JavaScript

## Notas

- La aplicación requiere acceso a la cámara del dispositivo
- Funciona mejor con buena iluminación
- El rendimiento puede variar según el dispositivo y la complejidad del código QR
