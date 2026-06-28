# BOOT/DOMAIN FIX — Acceso por `www.lectoguarida.cl`

## Causa raíz

El Worker estaba publicado y funcionando en `workers.dev`, pero el dominio personalizado `www.lectoguarida.cl` no tenía una ruta explícita en la configuración de Wrangler.  
Además, la primera tentativa de ruta usó `/*`, pero Cloudflare rechaza paths en dominios personalizados.

## Archivos revisados

- `outputs/Lectoguarida-Windows/wrangler.jsonc`
- `outputs/Lectoguarida-Windows/cloudflare/worker.mjs`
- `outputs/Lectoguarida-Windows/public/index.html`
- `outputs/Lectoguarida-Windows/public/app.js`
- `outputs/Lectoguarida-Windows/public/sw.js`

## Archivos modificados

- `outputs/Lectoguarida-Windows/wrangler.jsonc`
- `outputs/Lectoguarida-Windows/cloudflare/worker.mjs`

## Corrección aplicada

- Se agregó `routes` para los dominios personalizados:
  - `www.lectoguarida.cl`
  - `lectoguarida.cl`
- Se mantuvo `workers_dev: true` para no perder la URL técnica existente.
- Se agregó una redirección 301 desde el apex `lectoguarida.cl` hacia `www.lectoguarida.cl`.

## Pruebas ejecutadas

- `node --check public/app.js`
- `npm.cmd test`
- `npm.cmd run cloudflare:prepare`
- `npm.cmd run cloudflare:deploy`
- Verificación HTTP del dominio:
  - `https://www.lectoguarida.cl/` responde `200`

## Resultado

El dominio `www.lectoguarida.cl` ya quedó enlazado al Worker publicado.  
La home responde correctamente y ya no depende solo de `workers.dev`.

## Versión publicada

- `Current Version ID: fe0cbcaa-517a-4274-9fad-2e8f141878c0`

## Riesgos pendientes

- Si Cloudflare aún no propagó DNS en algún navegador, puede tardar unos minutos en reflejarse.
- Si quieres forzar que todo el tráfico use solo `www`, conviene revisar en el panel de Cloudflare que el registro raíz también esté activo o redirigido correctamente.
