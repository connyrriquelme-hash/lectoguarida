# RESUMEN DEL JUEGO — Lectoguarida

> Versión: 1.4.0
> Fecha del resumen: 27 junio 2026

---

## 1. VISIÓN GENERAL

**Lectoguarida** es una aventura educativa de fluidez lectora para 2.º básico (Chile). Convierte la práctica de lectura oral en expediciones cortas y personalizables, sin castigo por errores. Actualmente tiene 105 misiones, 315 actividades, un mapa 3D, sistema de economía (skins, stickers), panel docente, y versión PWA + Android APK.

**Público**: Estudiantes de 2.º básico (7-8 años) y su profesora (Conny).
**Stack**: Node.js (servidor local), Cloudflare Workers + D1 (producción), Vanilla JS (frontend SPA), Three.js (mapa 3D), Android WebView (APK).

---

## 2. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│  public/app.js (1222 líneas) — SPA Vanilla JS       │
│  public/styles.css (599 líneas) — Tema oscuro        │
│  public/index.html — Shell PWA                       │
│  public/conny.html — Panel docente (207 líneas)      │
│  public/world3d.bundle.js — Mapa 3D (Three.js)       │
│  public/content.js — Datos de lecturas (generado)    │
│  public/adventure-data.js — Zonas del mapa           │
│  public/curriculum-data.js — Currículum chileno      │
│  public/local-api.js (410 líneas) — API offline      │
│  public/remote-config.js — URL de API remota         │
│  public/sw.js — Service Worker (PWA)                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / fetch
┌──────────────────────▼──────────────────────────────┐
│                    BACKEND                           │
│  Dos implementaciones equivalentes:                  │
│                                                      │
│  1. LOCAL: server.mjs (1168 líneas)                  │
│     - Node.js http puro                              │
│     - Datos en data/store.json                       │
│     - Correr con: node server.mjs                    │
│                                                      │
│  2. CLOUDFLARE: cloudflare/worker.mjs (1948 líneas)  │
│     - Cloudflare Workers + D1 (SQLite)               │
│     - Seed data inline + D1 para persistencia        │
│     - Desplegar con: wrangler deploy                 │
│     - URL: https://lectoguarida.cl                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                    DATOS                             │
│  - data/store.json → Estado local (estudiantes,      │
│    intentos, stickers)                               │
│  - cloudflare/seed-store.mjs → Seed para D1         │
│  - D1 (Cloudflare) → app_state, teacher_sessions,   │
│    student_sessions                                  │
│  - localStorage → Preferencias de ruta por alumno   │
│  - sessionStorage → Tokens de autenticación          │
└─────────────────────────────────────────────────────┘
```

### Scripts principales (package.json)

| Script | Comando | Propósito |
|--------|---------|-----------|
| `start` | `node server.mjs` | Servidor local |
| `test` | `node --test tests/*.test.mjs` | Tests unitarios |
| `build:apk` | PowerShell → Android | Build APK portable |
| `cloudflare:deploy` | `npm run cloudflare:prepare && wrangler deploy` | Deploy a producción |
| `build:world3d` | esbuild world3d/ | Build mapa 3D |

---

## 3. MODELO DE DATOS

### Student

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único (ej: `student-leon-osorio`) |
| `name` | string | Nombre del estudiante |
| `grade` | number | Curso (2) |
| `avatar` | emoji | Emoji del avatar |
| `skin` | object | 5 partes: archetype, palette, outfit, accessory, companion |
| `xp` | number | Experiencia acumulada |
| `coins` | number | Monedas (economía del juego) |
| `unlocked` | string[] | Items cosmeticos desbloqueados (`"archetype:axolotl"`) |
| `streak` | number | Racha diaria actual |
| `longestStreak` | number | Racha máxima |
| `lastActiveDate` | string | Última fecha activa (YYYY-MM-DD, Chile timezone) |
| `stickers` | object | Colección: `{ stickerId: count }` |
| `packsOpened` | number | Paquetes de stickers abiertos |
| `packsSinceRare` | number | Paquetes sin rare/legendary (contador de pity) |
| `pinSalt` | string (hex) | Salt de 16 bytes para hash del PIN |
| `pinHash` | string (hex) | Hash PBKDF2-SHA-256 del PIN |
| `exchangeStars` | number | Estrellas de intercambio |
| `refuge` | object | Niveles de refugio: library, garden, observatory, musicRoom |
| `lastDailyRewardDate` | string | Fecha del último reward diario |
| `skillProgress` | object | Progreso por habilidad curricular |
| `createdAt` | string | Timestamp ISO |

**Skin**: Objeto con 5 partes cosmeticas:
- archetype: `axolotl`, `capybara`, `cosmic-cat`, `garden-dino`, `pastel-panda`, `forest-fox`, `cardboard-robot`, `rainbow-unicorn`, `artist-octopus`, `library-owl`, `music-frog`, `bubble-dragon`
- palette: `coral`, `aqua`, `violet`, `gold`, `mint`, `sky`
- outfit: `explorer`, `reader`, `artist`, `scientist`, `gardener`, `musician`
- accessory: `star-glasses`, `flower-crown`, `headphones`, `backpack`, `scarf`, `cap`
- companion: `firefly`, `cloud`, `star`, `book-sprite`, `butterfly`, `mini-comet`

### Attempt

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único del intento |
| `studentId` | string | Referencia al estudiante |
| `readingId` | string | ID de la lectura |
| `readingTitle` | string | Título (denormalizado) |
| `transcript` | string (max 1000) | Transcripción de la lectura oral |
| `elapsedSeconds` | number (10-600) | Tiempo tomado |
| `warmupAnswer` | string | Respuesta del warmup |
| `comprehensionAnswer` | string | Respuesta de comprensión |
| `scores` | object | Puntajes calculados (ver Scoring) |
| `createdAt` | string | Timestamp ISO |

### Scores (calculados por `scoreAttempt()`)

| Campo | Fórmula |
|-------|---------|
| `accuracy` | 0-100: LCS entre transcripción y texto objetivo |
| `wpm` | Palabras por minuto |
| `warmup` | 0 o 100 (correcto/incorrecto) |
| `comprehension` | 0 o 100 |
| `overall` | `accuracy*0.45 + wpm_score*0.15 + warmup*0.15 + comprehension*0.25` |
| `correctWords` | Palabras leídas correctamente (LCS) |
| `totalWords` | Total palabras objetivo |
| `focus` | `["Sonido R", "Sonido L", "Continuidad lectora", "Lectura estable", ...]` |
| `xp` | `20 + round(overall / 4)` |
| `coins` | `5 + round(overall / 10)` |
| `message` | Mensaje motivacional según rango de score |

### Reading (lectura/misión)

Cada lectura tiene:
- `id`, `title`, `grade`, `text` (el texto a leer)
- `warmup`: `{ type: "tap"|"write"|"build", prompt, options/answer }`
- `comprehension`: `{ question, options, answer }`
- `world` (zona del mapa), `order` (orden), `stage`
- `curriculum`: `{ oa: "...", domain: "Lenguaje"|"Ciencias"|"Historia"|"Intercultural" }`
- `focusSymbol` (letra/sílaba específica a practicar)

Total: 15 misiones de 1.º básico + 105 de 2.º básico (letras, grupos consonánticos, fluidez, currículum transversal) = 315 actividades (warmup + lectura + comprensión).

---

## 4. SISTEMA DE PUNTUACIÓN (SCORING)

1. **Normalización**: Se eliminan tildes y puntuación (`normalizeWords()`) — comparable para español chileno
2. **Alineación LCS**: Longest Common Subsequence para comparar transcripción vs texto objetivo — preserva orden
3. **Cálculo de accuracy**: `(correctWords / totalWords) * 100`
4. **WPM**: Palabras correctas / (elapsedSeconds / 60)
5. **Score WPM**: Escala no lineal — puntaje completo a 110+ WPM, decreciente
6. **Focus areas**: Detectadas por patrón de errores — "Sonido R", "Sonido L", "Continuidad lectora", etc.
7. **Mensajes**: Por rango — "¡Lectoguarida recuperó toda su luz!" (90+), "La magia de las palabras está despertando" (70-89), etc.

---

## 5. AUTENTICACIÓN

### Docente
- PIN fijo (variable de entorno `TEACHER_PIN`)
- Login → UUID token → `teacher_sessions` table (12h expiración)
- Bearer token en header `Authorization`

### Estudiante
1. Código de curso (`CLASS_CODE`) en header `X-Class-Code`
2. PIN de 4 dígitos, hasheado con PBKDF2-SHA-256 (100k iteraciones, salt 16 bytes)
3. Si no tiene PIN: `POST /pin/setup` lo crea
4. Si tiene PIN: `POST /login` lo verifica
5. Éxito → UUID token → `student_sessions` table (12h expiración)
6. El frontend persiste token en sessionStorage

### Perfil Demo (`teacher-demo-conny`)
- ID especial con backdoors: acepta PIN "1234" siempre
- Puede re-configurar PIN aunque ya tenga uno
- Todas las lecturas desbloqueadas
- 99999 XP, 99999 coins, todos los items cosmeticos

---

## 6. FLUJO DE JUEGO (ESTUDIANTE)

```
Home → "Soy estudiante" → Código de curso → Lista de estudiantes
→ Seleccionar perfil → Ingresar PIN (o crear) → Mapa de aventura
→ Seleccionar misión → Warmup (tap/write/build) → Lectura (karaoke + mic)
→ Comprensión (drag & drop) → Resultados (score ring + XP + coins)
→ Siguiente misión
```

### Pantallas (15 vistas en app.js)

| Vista | Función | Propósito |
|-------|---------|-----------|
| home | `homeView()` | Pantalla de inicio: "Soy estudiante" / "Soy profesora" |
| classLogin | `classLoginView()` | Ingresar código de curso |
| students | `studentsView()` | Grilla de estudiantes con búsqueda |
| studentPin | `studentPinView()` | Ingresar PIN (teclado numérico) |
| skinEditor | `skinEditorView()` | Editor de avatar cosmético |
| map | `mapView()` | Hub central: mapa 3D, racha, stats, botones |
| mission | `missionView()` | Briefing de misión: objetivo, rewards |
| warmup | `warmupView()` | Actividad previa (3 modos) |
| reading | `readingView()` | Lectura con karaoke + grabación |
| comprehension | `comprehensionView()` | Pregunta de comprensión drag & drop |
| result | `resultView()` | Resultados con animación |
| shop | `shopView()` | Tienda: skins + stickers |
| refuge | `refugeView()` | Refugio mejorable (5 niveles) |
| skills | `skillsView()` | Progreso de habilidades |
| trades | `tradesView()` | Intercambios entre estudiantes |
| teacherLogin | `teacherLoginView()` | Login docente |
| teacherDashboard | `teacherDashboardView()` | Panel docente completo |

### Mapa 3D
- Componente React Three.js en `world3d/World3DMap.jsx`
- Exporta API global `window.LectoguaridaWorld3D.mount(el, zones, onSelect)`
- 10 zonas de aventura con portales flotantes
- Estados visuales: bloqueado (oscuro), disponible (brillante), completo (dorado)
- Se monta/desmonta al entrar/salir del mapa

---

## 7. ECONOMÍA

| Elemento | Moneda | Costo |
|----------|--------|-------|
| Items cosméticos (skin) | Coins | 60-150 base + 5 por índice > 0 |
| Paquete de stickers | Coins | 50 |
| Refugio (por nivel) | Coins | Variable por zona |
| Reward diario | Coins + Stars | Gratis (1 vez al día) |
| XP por misión | XP | `20 + round(overall/4)` |
| Coins por misión | Coins | `5 + round(overall/10)` |

### Stickers (coleccionables)
- 7 sets temáticos: Humedales de Chile, Cuerpo y bienestar, Agua y clima, Paisajes de Chile, Pueblos y memorias, Universo lector, Clásicos de la Guarida
- 72 stickers totales
- Rarezas: common (90%), rare (9%), legendary (1%)
- Pity system: cada 5 paquetes garantiza rare/legendary
- 3 stickers por paquete
- Duplicados: reembolso en coins

### Rachas diarias
- Timezone: Chile (Santiago)
- Bonus: `2 + streak` coins (máx 10)
- Se reinicia si no juega un día

---

## 8. PANEL DOCENTE

URL: `/conny.html` (también desde app.js como vista)

Funcionalidades:
- **Stats**: Total estudiantes, activos, promedio, completitud, misiones realizadas
- **Roster**: Lista de estudiantes con búsqueda
- **Reportes individuales**: Progreso, último intento, semáforo de habilidades (Requiere apoyo / En desarrollo / Logrado)
- **PIN Management**: Resetear o asignar PIN a cualquier estudiante
- **Creación de estudiantes**: Individual o masivo (bloqueado en Cloudflare — nómina fija de 38)
- **Export CSV**: Descarga de todos los intentos
- **Login**: PIN docente (variable de entorno)

---

## 9. API ENDPOINTS (Worker.mjs)

### Públicas
- `GET /api/health` — Info del servidor
- `GET /api/students` — Lista de estudiantes (requiere X-Class-Code)

### Autenticación
- `POST /api/teacher/login` — Login docente → token
- `POST /api/students/:id/pin/setup` — Crear PIN → token
- `POST /api/students/:id/login` — Login con PIN → token

### Docente (requiere Bearer token)
- `GET /api/teacher/summary` — Resumen de clase
- `GET /api/teacher/export.csv` — Exportar CSV
- `POST /api/teacher/students` — Crear estudiante (bloqueado en Cloudflare)
- `POST /api/teacher/students/bulk` — Creación masiva (bloqueado)
- `POST /api/teacher/students/:id/set-pin` — Asignar PIN
- `POST /api/teacher/students/:id/reset-pin` — Resetear PIN

### Juego (requiere X-Class-Code)
- `GET /api/readings?grade=N&studentId=X` — Lecturas con progreso
- `POST /api/attempts` — Enviar intento de lectura
- `POST /api/students/:id/skin` — Cambiar skin
- `POST /api/students/:id/purchase` — Comprar item
- `POST /api/students/:id/sticker-pack` — Abrir paquete
- `POST /api/students/:id/daily-reward` — Reward diario
- `POST /api/students/:id/refuge/upgrade` — Mejorar refugio
- `GET/POST /api/students/:id/trades` — Intercambios
- `POST /api/students/:id/trades/:id/respond` — Responder intercambio

---

## 10. INFRAESTRUCTURA

### Local
- Node.js HTTP server (`server.mjs`) en `127.0.0.1:4173`
- Datos en `data/store.json` (archivo JSON)
- Correr con: `node server.mjs` o `Iniciar-Lectoguarida.cmd`

### Cloudflare (Producción)
- **Worker**: `lectoguarida-conny` en `cloudflare/worker.mjs`
- **D1 Database**: `lectoguarida-db` con tabla `app_state` (JSON blob), `teacher_sessions`, `student_sessions`
- **Assets**: Carpeta `public/` servida estáticamente
- **Custom domain**: `lectoguarida.cl` y `www.lectoguarida.cl`
- **Deploy**: `npm run cloudflare:deploy`
- **Concurrencia**: Optimistic locking con retry (5 intentos) en D1

### Android APK
- WebView wrapping el frontend
- API local bridge (`window.lectoguaridaLocalApi`)
- Speech nativo bridge (`window.LectoguaridaSpeech`)
- Build: `npm run build:apk`
- Gradle + JDK descargado automáticamente

---

## 11. CURRÍCULUM CHILENO (OA)

Las lecturas están mapeadas a objetivos de aprendizaje del MINEDUC:
- **Lenguaje**: 24 lecturas (OA 1, 3, 4, 5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 27)
- **Ciencias**: 8 lecturas (OA 2, 4, 5, 6, 10, 11, 12, 14)
- **Historia/Chile**: 8 lecturas (OA 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)
- **Intercultural**: 8 lecturas (OA 1, 2, 3, 4, 5, 6, 7, 8)

El `skillProgress` del estudiante rastrea hasta 12 puntos por OA, con niveles 1-3.

---

## 12. ARCHIVOS CLAVE

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `server.mjs` | 1168 | Servidor Node.js local |
| `cloudflare/worker.mjs` | 1948 | Worker Cloudflare (bundled) |
| `public/app.js` | 1222 | Frontend SPA |
| `public/styles.css` | 599 | Estilos |
| `public/conny.html` | 207 | Panel docente |
| `public/local-api.js` | 410 | API offline/local |
| `data/store.json` | ~1797 | Datos persistentes locales |
| `cloudflare/seed-store.mjs` | ~1797 | Seed data para D1 |
| `world3d/World3DMap.jsx` | 133 | Componente mapa 3D |
| `loot.mjs` | 24 | Utilidades de loot/pity |
| `tools/prepare-cloudflare.mjs` | 23 | Prepara deploy Cloudflare |
| `tools/build-apk-portable.ps1` | 108 | Build Android APK |
| `tests/scoring.test.mjs` | 67 | Tests de scoring |
| `tests/loot.test.mjs` | 30 | Tests de loot |

---

## 13. DEPENDENCIAS (npm)

| Paquete | Versión | Uso |
|---------|---------|-----|
| `wrangler` | ^4.103.0 | CLI Cloudflare Workers |
| `react` | ^19.2.7 | Mapa 3D |
| `react-dom` | ^19.2.7 | Mapa 3D |
| `@react-three/fiber` | ^9.6.1 | Renderizador Three.js para React |
| `three` | ^0.184.0 | Motor 3D |
| `esbuild` | ^0.28.1 | Bundler para mapa 3D |

---

## 14. ESTUDIANTES (38)

37 estudiantes reales de 2.º básico (nómina fija) + 1 perfil demo:
- `teacher-demo-conny` (Conny demo) — todos los niveles desbloqueados

---

## 15. POSIBLES MEJORAS (identificadas)

1. **Refactor frontend**: app.js es spaghetti de 1222 líneas — dividir en módulos
2. **Typescript**: Migrar server.mjs y worker.mjs a TS para mejor mantenibilidad
3. **Backend unificado**: server.mjs y worker.mjs tienen lógica duplicada — extraer a módulo compartido
4. **Test coverage**: Solo 2 archivos de test (scoring, loot) — faltan tests de API, frontend
5. **CI/CD**: No hay pipeline automatizado
6. **Base de datos normalizada**: D1 usa JSON blob — migrar a tablas normalizadas
7. **Auth de estudiante**: Se crean sesiones pero no se verifican en rutas de juego (solo class code)
8. **Localización**: Solo español chileno
9. **Analíticas**: No hay tracking de uso
10. **Múltiples cursos**: Actualmente solo 1 curso (2.º básico)
