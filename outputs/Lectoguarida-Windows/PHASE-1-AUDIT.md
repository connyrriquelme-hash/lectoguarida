# Lectoguarida - Fase 1, auditoria tecnica segura

Fecha de revision: 2026-06-27

## Stack detectado

- Frontend web en JavaScript modular en `public/app.js`.
- Estilos en `public/styles.css`.
- Contenido y progresion en `public/content.js`, `public/content.json` y `public/adventure-data.js`.
- Servidor local Node en `server.mjs`.
- Backend online Cloudflare Workers en `cloudflare/worker.mjs`.
- Persistencia local en `data/store.json`.
- App Android WebView en `android/`.
- Mapa 3D en `world3d/World3DMap.jsx` y bundle ya generado en `public/world3d.bundle.js`.

## Rutas existentes

- `/` pagina principal
- `/descargar.html` pagina de descarga
- `/conny.html` panel docente
- APIs locales y online para estudiantes, docencia, attempts y progreso

## Componentes principales

- Flujo de estudiante con PIN, mapa, mision, lectura oral, comprension y resultados.
- Flujo docente con dashboard, busqueda de estudiantes, exportacion y gestion de PIN.
- Tienda, album, refugio, trades y racha diaria.
- Mapa 3D interactivo como apoyo visual.

## Riesgos de romper algo

- `public/app.js` concentra la logica principal de navegacion y estados.
- `public/content.js` contiene mucho contenido; cambiarlo de golpe puede afectar niveles ya existentes.
- Local y Cloudflare comparten estructura de datos; conviene mantener compatibilidad hacia atras.
- El APK y el modo online dependen del contenido estatico ya empaquetado.

## Estrategia segura recomendada

1. Mantener intacto el flujo actual.
2. Extraer nuevos modulos de datos sin activar todavia.
3. Agregar nuevas tablas o campos solo como extensiones.
4. Verificar compilacion despues de cada paso.
5. Migrar por fases pequenas, reversibles y comprobables.

## Primera fase minima segura

- Crear base curricular nueva en archivos separados.
- Mantener el contenido actual como fuente principal hasta terminar la migracion.
- Preparar motor adaptativo y banco de ejercicios solo como lectura pasiva al inicio.
