# BASELINE-STABLE — Lectoguarida

Fecha de referencia: 2026-06-27  
Versión base publicada: `4efdd724-b9ef-4998-a55a-d5f38dc65c3d`

Este documento define la versión estable mínima que debe conservarse como referencia antes de publicar cualquier ciclo nuevo.

Regla de oro:

- Ningún ciclo se publica si rompe el arranque.
- Ningún ciclo se publica si rompe login/PIN.
- Ningún ciclo se publica si rompe el panel docente.
- Ningún ciclo se publica si rompe el mapa, los niveles o la lectura con micrófono.
- Si una mejora afecta estabilidad, primero se desactiva con feature flags o se revierte.

## Pantallas funcionales de referencia

### 1. Home / Entrada principal

Estado esperado:

- Se ve el encabezado de Lectoguarida.
- Se puede ingresar al flujo de estudiante.
- No queda atrapada en el fallback de carga.
- El layout carga en escritorio y en celular.

Descripción visual:

- Fondo oscuro con identidad de marca.
- CTA principal visible.
- Pantalla breve, sin distracciones pesadas.

### 2. Login de curso

Estado esperado:

- Permite ingresar código de curso.
- Valida acceso antes de mostrar perfiles.
- Mantiene un flujo simple para apoderados y docentes.

Descripción visual:

- Tarjeta centrada.
- Botón claro de ingreso.
- Mensaje de estado visible.

### 3. Selector de estudiantes

Estado esperado:

- Lista de perfiles disponible.
- Búsqueda funcional.
- Se puede entrar a un perfil sin errores.

Descripción visual:

- Tarjetas con nombre, avatar y estado.
- Vista amigable para uso en casa.

### 4. PIN / seguridad de perfil

Estado esperado:

- Teclado numérico en pantalla.
- Validación de 4 dígitos.
- No expone secretos en frontend.

Descripción visual:

- Interfaz grande y táctil.
- Mensajes breves y calmados.

### 5. Mapa de aventura / niveles

Estado esperado:

- Renderiza el mapa.
- Permite abrir niveles existentes.
- Mantiene fallback al selector clásico si algo falla.

Descripción visual:

- Portales / zonas por etapas.
- Nodos de nivel con estado visible.
- Navegación clara y responsiva.

### 6. Pantalla de misión / lectura

Estado esperado:

- Muestra la lectura activa.
- Permite avanzar a calentamiento, lectura y comprensión.
- Micrófono disponible y funcional.

Descripción visual:

- Texto de lectura legible.
- Botón de grabación cercano al texto.
- Componentes grandes en celular.

### 7. Comprensión lectora

Estado esperado:

- Permite responder sin alternativas tipo examen tradicional.
- Los botones o interacciones funcionan.
- Se guarda el resultado al finalizar.

Descripción visual:

- Opciones grandes.
- Feedback claro.

### 8. Panel docente

Estado esperado:

- Ingreso docente operativo.
- Muestra resumen y progreso.
- Exportación CSV funcional.

Descripción visual:

- Tablas legibles.
- Botones claros.
- No depende del estado de estudiante.

### 9. Service worker / fallback

Estado esperado:

- El fallback solo aparece mientras realmente está cargando.
- Si la app carga bien, el fallback se oculta.
- Si falla algo, queda como respaldo visible.

Descripción visual:

- Mensaje corto.
- CTA de recarga.
- Sin bloqueo permanente cuando la app sí está lista.

## Capturas de referencia

Capturas sugeridas para documentar la baseline estable:

- `capture-home.png`
- `capture-login-curso.png`
- `capture-selector-estudiantes.png`
- `capture-pin.png`
- `capture-mapa.png`
- `capture-mision.png`
- `capture-lectura.png`
- `capture-comprension.png`
- `capture-panel-docente.png`
- `capture-fallback.png`

Si se generan capturas nuevas, deben guardarse junto a este documento o en una carpeta de evidencias del ciclo.

## Checklist de regresión obligatoria

Antes de publicar cualquier ciclo:

- [ ] La home carga sin consola roja crítica.
- [ ] El fallback desaparece cuando la app montó correctamente.
- [ ] Login / PIN de estudiante funciona.
- [ ] Login docente funciona.
- [ ] El selector de estudiantes carga.
- [ ] El mapa de aventura carga.
- [ ] Se puede abrir un nivel.
- [ ] La pantalla de lectura muestra texto y micrófono.
- [ ] La comprensión lectora responde y guarda resultado.
- [ ] El panel docente carga.
- [ ] Exportación CSV funciona.
- [ ] El service worker no bloquea el arranque.
- [ ] La app sigue usable en celular.
- [ ] No aparecen `ReferenceError` nuevos en consola.
- [ ] No se exponen claves ni secretos.
- [ ] No se rompen rutas críticas.

## Regla de publicación

Un ciclo solo puede publicarse si cumple todo lo siguiente:

1. `npm.cmd test` pasa.
2. `npm.cmd run cloudflare:prepare` pasa.
3. `npm.cmd run cloudflare:deploy` pasa.
4. La regresión básica no rompe ninguna pantalla de esta baseline.
5. Si una capa nueva introduce riesgo, debe quedar apagada por feature flag o completamente aislada.

## Estado de seguridad actual

La baseline estable actual privilegia:

- núcleo lector
- inicio de sesión
- perfiles
- mapa
- lectura con micrófono
- panel docente
- exportación

Las capas experimentales deben reactivarse solo después de validar que no afectan esta base.
