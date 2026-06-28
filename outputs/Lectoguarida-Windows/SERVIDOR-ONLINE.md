# Lectoguarida online · APK descargable + resultados para Conny

Este modo permite:

1. Compartir una URL para descargar el APK.
2. Registrar los intentos/puntajes que envían los celulares.
3. Revisar resultados desde un panel web docente.
4. Exportar resultados a CSV.

## URLs del servidor

Cuando subas el proyecto a un servidor Node:

- Descarga del APK: `/descargar.html`
- APK directo: `/Lectoguarida-debug.apk`
- Panel de Conny: `/conny.html`
- Estado API: `/api/health`

## Variables recomendadas

Configura estas variables en el hosting:

```text
HOST=0.0.0.0
TEACHER_NAME=Conny
TEACHER_PIN=elige-un-pin-seguro
CORS_ORIGIN=*
```

El hosting normalmente define `PORT` automáticamente.

## Cómo conectar el APK al servidor online

Cuando tengas la URL pública, por ejemplo:

```text
https://lectoguarida-conny.onrender.com
```

ejecuta desde la carpeta raíz:

```powershell
node tools/configure-remote-api.mjs https://lectoguarida-conny.onrender.com
npm run export:android
npm run build:apk
```

Eso genera un nuevo `Lectoguarida-debug.apk` que enviará resultados a esa URL.

## Cómo usarlo con estudiantes

1. Conny entra a `https://TU-SERVIDOR/descargar.html`.
2. Comparte ese enlace por WhatsApp, correo o Classroom.
3. Cada apoderado descarga e instala el APK.
4. El estudiante elige su perfil, juega/lee y completa una misión.
5. El APK envía el intento al servidor online.
6. Conny entra a `https://TU-SERVIDOR/conny.html` y revisa los resultados.

## Si no hay conexión

El APK guarda el intento localmente. Si el servidor está configurado, intentará reenviar resultados pendientes en usos posteriores.

## Seguridad mínima del MVP

- Cambia `TEACHER_PIN`; no dejes el PIN `2468` en producción.
- No publiques datos sensibles reales durante pilotos.
- Para uso formal con menores se recomienda agregar cuentas, consentimiento de apoderados, HTTPS obligatorio y una política de privacidad revisada legalmente.
