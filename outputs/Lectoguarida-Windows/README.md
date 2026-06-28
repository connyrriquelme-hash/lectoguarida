# Lectoguarida para Windows y smartphone

Lectoguarida es una aventura de fluidez lectora centrada en 2.º básico. Convierte la práctica oral en expediciones breves, personalizables y sin castigos por error.

## Iniciar en Windows

1. Haz doble clic en `Iniciar-Lectoguarida.cmd`.
2. Se abrirá `http://127.0.0.1:4173` en Edge o Chrome.
3. Mantén abierta la ventana negra mientras usas la aplicación.

Administradora y profesora: **Conny**. El PIN docente se configura de forma privada en el servidor.

## Contenido y progresión

- **105 niveles para 2.º básico** y tres actividades en cada nivel: **315 actividades**.
- Expediciones ilimitadas: al terminar la campaña, los textos vuelven con desafíos de precisión, ritmo, prosodia e inferencia.
- Editor persistente con **90 opciones** entre personajes, paletas, vocaciones, accesorios y compañeros.
- **72 stickers distribuidos en 7 álbumes temáticos**, con repetidos reciclables y garantía antifrustración.
- Cada nivel desbloquea y fortalece una habilidad vinculada al currículum chileno, visible para estudiante y profesora.
- Mercado amistoso de objetos: ambos perfiles deben aceptar y cada uno paga 10 coins; nunca interviene dinero real.
- **37 perfiles iniciales y cupo administrable hasta 40**; la profesora Conny puede crear nuevos perfiles desde su panel y cada estudiante avanza de manera independiente.
- Panel docente con precisión, palabras por minuto, comprensión, XP, focos de apoyo y niveles jugados.

## Uso desde casa

La interfaz es una PWA liviana: HTML, CSS, JavaScript y un ícono vectorial, sin videos ni paquetes de imágenes pesadas. En un navegador compatible aparecerá **Instalar Lectoguarida**. Para abrirla desde otro teléfono de la misma red se debe adaptar el servidor para escuchar la red local; esta versión, por seguridad, solo escucha en el PC (`127.0.0.1`).

El reconocimiento de voz del navegador puede requerir internet. Si no está disponible, se puede escribir la transcripción o usar **Cargar lectura de prueba**.

## APK para celulares Android

La carpeta `android/` contiene una app Android WebView preparada para generar un APK instalable en celulares. Esta versión no depende de `localhost`: embebe los archivos de `public/`, usa almacenamiento local del teléfono y conecta el micrófono con `SpeechRecognizer`.

Antes de compilar, sincroniza el contenido:

```powershell
npm run export:android
```

Luego abre `android/` en Android Studio o usa Gradle para generar `app-debug.apk`. Consulta `android/README-APK.md`.

## Modo online para Conny

También está preparado un servidor online para compartir el APK y recibir resultados:

- Página de descarga: `https://TU-SERVIDOR/descargar.html`
- APK directo: `https://TU-SERVIDOR/Lectoguarida-debug.apk`
- Panel docente de Conny: `https://TU-SERVIDOR/conny.html`
- Exportación CSV desde el panel.

Para que el APK que envíes a las familias registre resultados online, primero debes configurar la URL pública del servidor:

```powershell
node tools/configure-remote-api.mjs https://TU-SERVIDOR
npm run export:android
npm run build:apk
```

El detalle completo está en `SERVIDOR-ONLINE.md`.

## Privacidad y límites del MVP

- Los datos se guardan únicamente en `data/store.json`.
- El PIN es una protección local de demostración, no autenticación de producción.
- No exponer el servidor a internet ni ingresar datos sensibles reales.
- Para uso domiciliario real en varios dispositivos se recomienda una API autenticada, PostgreSQL y consentimiento de apoderados.

Consulta `PLAN-3-SEMANAS.md`, `MAPA-CURRICULAR-CHILE.md` e `INSPIRACION-Y-LICENCIAS.md` para el detalle pedagógico y de diseño.

Para cerrar, vuelve a la ventana negra y presiona `Ctrl+C`.
