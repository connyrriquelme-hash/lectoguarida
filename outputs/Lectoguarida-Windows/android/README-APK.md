# Generar APK instalable · Lectoguarida

Objetivo: crear un archivo `app-debug.apk` para instalar directamente en celulares Android, sin Play Store.

## Flujo recomendado

Desde la raíz de Lectoguarida:

```powershell
npm run export:android
```

Luego, dentro de `android/`:

```powershell
gradle :app:assembleDebug
```

El APK queda en:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Instalar en un celular

Opción simple:

1. Copiar `app-debug.apk` al celular.
2. Abrir el archivo desde el teléfono.
3. Permitir “instalar apps desconocidas” para el explorador/WhatsApp/Drive que estés usando.
4. Instalar Lectoguarida.

Opción con cable USB y ADB:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Notas

- El APK debug sirve para pilotaje interno, no para publicación pública.
- Para distribuir masivamente conviene generar un APK release firmado o publicar un AAB en Play Console.
- El micrófono pedirá permiso la primera vez que se use el “oído mágico”.
