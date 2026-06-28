# Lectoguarida Android · Publicación gratuita en Play Store

Esta carpeta convierte Lectoguarida en una app Android liviana, preparada para generar un **Android App Bundle (`.aab`)** y subirlo a Google Play Console como aplicación gratuita.

## Qué incluye

- App Android nativa con `WebView`.
- Contenido embebido: no depende de `localhost` ni de un servidor Node en el teléfono.
- 37 perfiles demo, skins, misiones, puntajes y panel docente usando almacenamiento local del dispositivo.
- Puente nativo de voz con `SpeechRecognizer` y permiso `RECORD_AUDIO`.
- Paquete Android: `cl.lectoguarida.app`.
- Versión inicial: `0.4.0-mvp`, `versionCode 1`.

## Requisitos para compilar

1. Instalar Android Studio.
2. Instalar Android SDK con API 35 o superior.
3. Abrir la carpeta `android/` desde Android Studio.
4. Esperar la sincronización de Gradle.

## Sincronizar cambios de la web antes de compilar

Desde la carpeta raíz de Lectoguarida:

```powershell
npm run export:android
```

Esto exporta las misiones a `public/content.js` y copia todos los assets a:

```text
android/app/src/main/assets/public/
```

## Generar el archivo para Play Store

En Android Studio:

1. `Build` → `Generate Signed Bundle / APK`.
2. Elegir `Android App Bundle`.
3. Crear o seleccionar una llave de firma.
4. Elegir variante `release`.
5. Subir el `.aab` generado a Play Console.

## Configuración sugerida en Play Console

- Nombre: `Lectoguarida`.
- Precio: gratuito.
- Categoría: Educación.
- Público objetivo: niños/as de 6 a 8 años, con revisión cuidadosa de políticas de familias.
- Permisos declarados: micrófono.
- Datos: progreso lector, perfiles locales y transcripciones se almacenan en el dispositivo en esta versión MVP.

## Importante

Para publicarla realmente necesitas una cuenta de Google Play Console del titular del proyecto. El código queda listo para compilar y subir, pero la publicación requiere completar ficha, cuestionarios, clasificación de contenido, política de privacidad y revisión de Google.
