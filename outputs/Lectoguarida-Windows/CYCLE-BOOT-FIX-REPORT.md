# CYCLE-BOOT-FIX-REPORT

## Causa raíz

El arranque podía quedarse atrapado en la pantalla de fallback por dos factores combinados:

1. El flujo de arranque dependía de que `render()` se ejecutara sin errores y luego ocultara manualmente el fallback.
2. El service worker cacheaba documentos y assets de forma agresiva, lo que podía devolver una versión anterior de `index.html` o `app.js` al navegador, manteniendo visible el fallback aunque ya existiera una versión corregida.

## Archivos revisados

- `outputs/Lectoguarida-Windows/public/index.html`
- `outputs/Lectoguarida-Windows/public/app.js`
- `outputs/Lectoguarida-Windows/public/sw.js`
- `outputs/Lectoguarida-Windows/public/styles.css`
- `outputs/Lectoguarida-Windows/cloudflare/worker.mjs`

## Archivos modificados

- `outputs/Lectoguarida-Windows/public/app.js`
- `outputs/Lectoguarida-Windows/public/index.html`
- `outputs/Lectoguarida-Windows/public/sw.js`

## Corrección aplicada

- Se agregó instrumentación de boot con logs claros:
  - DOM cargado
  - app.js cargado
  - service worker registrado
  - render inicial iniciado
  - fallback ocultado
  - errores globales y promesas rechazadas
- Se mantuvo el fallback como respaldo visible solo si el arranque falla.
- Se agregó un timeout de boot para evitar espera indefinida.
- Se cambió el service worker a estrategia network-first para documentos y assets críticos.
- Se aplicó cache busting simple en `index.html` usando parámetros de versión en CSS, JS y recursos.

## Pruebas ejecutadas

- `node --check public/app.js`
- `npm.cmd test`
- `npm.cmd run cloudflare:prepare`
- `npm.cmd run cloudflare:deploy`

## Resultado

El boot queda más resistente y el fallback ya no debería quedarse pegado cuando la app principal carga correctamente. Si el arranque falla de verdad, el fallback sigue visible con un tiempo máximo y con trazas de diagnóstico en consola.

## Versión publicada

- `https://lectoguarida-conny.connyrriquelme.workers.dev`
- Current Version ID: `b892d22f-84dc-4a12-8a2d-e664d2d7fd5b`

## Riesgos pendientes

- Si un dispositivo conserva una sesión de service worker muy antigua, podría requerir una recarga manual inicial para adoptar el nuevo worker.
- Conviene seguir monitoreando la consola del navegador si aparece un fallo externo de red o un asset faltante.
