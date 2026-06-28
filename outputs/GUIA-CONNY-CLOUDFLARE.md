# Lectoguarida online · Guía privada de Conny

## Enlaces permanentes

- Estudiantes: https://lectoguarida-conny.connyrriquelme.workers.dev/
- Panel docente: https://lectoguarida-conny.connyrriquelme.workers.dev/conny.html
- Descargar para Android: https://lectoguarida-conny.connyrriquelme.workers.dev/descargar.html

## Accesos

- Código para estudiantes y familias: `GUARIDA-27`
- PIN privado del panel docente: `6284`

No compartas el PIN docente con estudiantes. Sí puedes compartir el código del curso con las familias.

## Uso diario

1. La familia abre el enlace estudiantil en Chrome.
2. Escribe `GUARIDA-27`, selecciona el perfil y crea un PIN personal de 4 números la primera vez.
3. Al terminar una actividad, el resultado se guarda en Cloudflare D1.
4. Conny abre el panel, escribe su PIN y revisa los avances.
5. Si un estudiante no puede crear u olvida su PIN, Conny escribe cuatro números en **Crear o cambiar PIN** dentro de su ficha. Esto no borra su progreso.
6. El botón **Descargar CSV** guarda una copia de los resultados.

Los PIN estudiantiles se guardan mediante PBKDF2-SHA256 con salt aleatoria; nunca se muestran en el panel. La sesión dura 12 horas para no interrumpir una lectura.

## Voz cálida opcional

La app ya intenta usar OpenAI TTS con español latinoamericano y acento chileno suave. Mientras no exista una clave de API, utiliza automáticamente la voz `es-CL` disponible en el celular o navegador.

Para activar la voz neural cuando tengas una clave:

```powershell
npx.cmd wrangler secret put OPENAI_API_KEY
npx.cmd wrangler deploy
```

La grabación de la voz del niño permanece en su dispositivo para **Escuchar mi lectura** y no se sube al servidor.

El computador de Conny puede permanecer apagado. La aplicación y la base funcionan en Cloudflare.

## Cambiar los códigos

Desde la carpeta `outputs\Lectoguarida-Windows`:

```powershell
npx.cmd wrangler secret put CLASS_CODE
npx.cmd wrangler secret put TEACHER_PIN
```

Wrangler solicitará el nuevo valor sin guardarlo en el código.
