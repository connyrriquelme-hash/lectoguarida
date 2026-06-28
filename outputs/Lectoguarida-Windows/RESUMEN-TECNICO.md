# RESUMEN TÉCNICO — Lectoguarida (para equipo de desarrollo)

> Proyecto: `lectoguarida-windows-prototype` v1.4.0
> Stack: Node.js + Vanilla JS SPA + Cloudflare Workers + D1 + Three.js + Android WebView

---

## 1. ARQUITECTURA DEL FRONTEND (`public/app.js` — 1222 líneas)

### Patrón
**Vanilla JS SPA sin framework.** No React, Vue ni Angular. El patrón es:

```
Estado global → render() → innerHTML → bindViewEvents()
                            ↑                        │
                            └── handleAction() ←──────┘
```

- **Estado**: Objeto global `state` con ~40 propiedades (línea 60-104)
- **Renderizado**: `render()` (línea 817) reemplaza `app.innerHTML` con el HTML de la vista activa
- **Eventos**: Atributo `data-action="nombre"` en elementos HTML → `handleAction()` centralizado
- **Routing**: Solo `state.view = 'map'` + `render()` — sin router

### Sistema de Vistas (15 vistas)

```
home → classLogin → students → studentPin → map → mission → warmup → reading → comprehension → result
  │                                  │          ├── skinEditor
  └── teacherLogin → teacherDashboard  │         ├── shop
                                        │         ├── refuge
                                        │         ├── skills
                                        │         └── trades
```

Cada vista es una función que retorna HTML string:
```js
const views = {
  home: homeView,       // Pantalla inicio: "Soy estudiante" / "Soy profesora"
  classLogin: classLoginView,  // Ingreso código de curso
  students: studentsView,      // Grilla de estudiantes con búsqueda
  studentPin: studentPinView,  // Teclado numérico PIN (setup/login/confirm)
  skinEditor: skinEditorView,  // Editor de avatar (5 categorías)
  map: mapView,                // Hub central: stats, zonas, botones
  mission: missionView,        // Briefing de misión
  warmup: warmupView,          // Tap/write/build según tipo
  reading: readingView,        // Karaoke + mic + timer
  comprehension: comprehensionView, // Drag & drop escena
  result: resultView,          // Score ring + stats + skill unlock
  shop: shopView,              // Tienda skins + stickers
  refuge: refugeView,          // Refugio mejorable (5 niveles)
  skills: skillsView,          // Progreso de habilidades
  trades: tradesView,          // Intercambios P2P
  teacherLogin: teacherLoginView,
  teacherDashboard: teacherDashboardView
};
```

### API Caller
```js
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.classCode) headers['X-Class-Code'] = state.classCode;
  if (path.startsWith('/api/teacher/') && state.teacherToken)
    headers.Authorization = `Bearer ${state.teacherToken}`;
  else if (state.studentToken)
    headers.Authorization = `Bearer ${state.studentToken}`;
  if (window.lectoguaridaLocalApi)   // ← Native bridge (APK)
    return window.lectoguaridaLocalApi(path, { ...options, headers });
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la acción');
  return data;
}
```

### Sesiones (sessionStorage)
```js
// Persistencia en sessionStorage
sessionStorage.setItem('studentToken', result.token);
sessionStorage.setItem('studentSessionId', result.student.id);
sessionStorage.setItem('teacherToken', token);
sessionStorage.setItem('classCode', code);

// Recuperación en inicialización de state
teacherToken: sessionStorage.getItem('teacherToken') || '',
classCode: sessionStorage.getItem('classCode') || '',
studentToken: sessionStorage.getItem('studentToken') || '',
studentSessionId: sessionStorage.getItem('studentSessionId') || '',
```

### Mapa 3D (Three.js)
```js
function mountWorld3D() {
  const target = app.querySelector('#world3dMap');
  if (!target || !window.LectoguaridaWorld3D) return;
  // Agrupa readings por zona de aventura
  const zones = adventureZones.map((z, i) => ({
    ...z, color: colors[i],
    complete: /* todas las readings de la zona completadas */,
    locked: /* todas bloqueadas */
  }));
  window.LectoguaridaWorld3D.mount(target, zones, (id) => {
    app.querySelector(`.zone-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  });
}
```
El bundle `world3d.bundle.js` se genera desde `world3d/World3DMap.jsx` con esbuild.

### Editor de Skin
```js
// ownsItem: verifica si el item está en student.unlocked
function ownsItem(student, part, id) {
  const catalog = ['archetype','palette','outfit','accessory','companion'];
  const index = SKIN_CATALOG[part].indexOf(id);
  return index <= 0 || student.unlocked.includes(inventoryKey(part, id));
}
// inventoryKey: "archetype:axolotl"
function inventoryKey(part, value) { return `${part}:${value}`; }
```

### Sistema de Stickers (Gacha)
```js
// Apertura de paquete (2 fases de render)
if (action === 'open-sticker-pack') {
  const result = await api(`/api/students/${id}/sticker-pack`, { method:'POST', body:'{}' });
  state.packOpening = { special };        // Fase 1: animación (envelope)
  render();
  await new Promise(r => setTimeout(r, special ? 650 : 300));
  state.packOpening = null;
  state.packResult = result;               // Fase 2: revelar stickers
  render();
}
```

### Karaoke
```js
function startKaraokeReading() {
  // Path A: Neural TTS → fetchNeuralAudio(text) → Audio element + setInterval(80ms)
  //   calcula peso por palabra (max(2, length sin puntuación))
  //   wordIndex = findIndex en cumulative weights según audio.currentTime/audio.duration
  // Path B: SpeechSynthesis → utterance con rate 0.82, lang es-CL, onboundary
  // Path C: Timer fallback → setInterval(430ms/word)
  // setKaraokeWord(index) → .karaoke-word.active / .passed
}
```

### Componentes Reutilizables
- **showToast(msg)**: notificación temporal con auto-destrucción
- **speakInstruction(text)**: TTS con fallback: neural → native → SpeechSynthesis
- **rewardJuice()**: Web Audio API (osciladores C-E-G, 3 notas) + CSS screen shake + vibrate
- **setSession(text)**: actualiza el texto del header `<h1>`
- **skinAvatar(student, size)**: genera HTML del avatar 4-partes como emojis

---

## 2. SERVIDOR LOCAL (`server.mjs` — 1168 líneas)

### Motor HTTP
Node.js `http` puro, sin Express. Rutas definidas por `url.pathname.startsWith()`.

```js
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  if (url.pathname === '/Lectoguarida-debug.apk' || url.pathname === '/descargar-apk')
    await serveApk(req, res);
  else if (url.pathname.startsWith('/api/'))
    await handleApi(req, res, url);
  else
    await serveStatic(req, res, url);
});
```

### Store (archivo JSON)
```js
// seedStore() → estructura inicial
const seedStore = () => ({
  version: 5,
  teacher: { id: 'teacher-conny', name: 'Conny', pin: '6284' },
  students: DEMO_ROSTER.map(rosterStudent),  // 37 estudiantes fijos
  attempts: [],
  tradeOffers: []
});

// loadStore() → carga con migraciones automáticas (10 migraciones)
async function loadStore() {
  const store = JSON.parse(await readFile(STORE_PATH, 'utf8'));
  // Migraciones: legacy IDs, roster version, teacher fields, PIN, economy, etc.
  // detecta cambios con serialización JSON antes/después
  if (changed) await saveStore(store);
  return store;
}

// saveStore() → escritura atómica
async function saveStore(store) {
  const temp = `${STORE_PATH}.tmp`;
  await writeFile(temp, JSON.stringify(store, null, 2), 'utf8');
  await rename(temp, STORE_PATH);  // rename es atómico en OS
}
```

### Motor de Scoring
```js
function normalizeWords(text = '') {
  return text.toLocaleLowerCase('es-CL').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // elimina diacríticos
    .replace(/[^a-zñü\s]/g, ' ')       // solo letras + espacios
    .split(/\s+/).filter(Boolean);
}

function lcsMatches(target, spoken) {
  // LCS clásico O(n*m) con DP + backtracking
  // Retorna { count, matchedTarget (Set<index>) }
}

function scoreAttempt({ reading, transcript, elapsedSeconds, warmupAnswer, comprehensionAnswer }) {
  const accuracy = round(correctWords / target.length * 100);                    // peso 45%
  const paceScore = min(100, round(wpm / targetWpm * 100));                       // peso 15%
  // targetWpm: grade 1 → 30, grade 2+ → 50
  const warmup = answersMatch(warmupAnswer, reading.warmup.correct) ? 100 : 0;    // peso 15%
  const comprehension = answersMatch(comprehensionAnswer, reading.comprehension.correct) ? 100 : 0; // 25%
  const overall = round(accuracy * 0.45 + paceScore * 0.15 + warmup * 0.15 + comprehension * 0.25);
  const xp = 20 + round(overall / 4);
  const coins = 5 + round(overall / 10);
  // Focus areas auto-detectados
  const focus = [];
  if (missed.some(w => w.includes('r'))) focus.push('Sonido R');
  if (missed.some(w => w.includes('l'))) focus.push('Sonido L');
  if (missed.length >= 3) focus.push('Precisión de palabras');
  if (wpm < targetWpm * 0.65) focus.push('Continuidad lectora');
  // ...
}
```

### Autenticación (local)
```js
// PIN estudiante: PBKDF2-SHA-256, 100k iteraciones, salt 16 bytes
function createPinRecord(pin) {
  const salt = randomBytes(16);
  return { pinSalt: salt.toString('hex'), pinHash: pbkdf2Sync(String(pin), salt, 100_000, 32, 'sha256').toString('hex') };
}
function verifyPin(pin, student) {
  const expected = Buffer.from(student.pinHash, 'hex');
  const actual = pbkdf2Sync(String(pin), Buffer.from(student.pinSalt, 'hex'), 100_000, 32, 'sha256');
  return expected.length === actual.length && timingSafeEqual(expected, actual);  // timing-safe
}
// Sesiones: Map en memoria (tokens UUID con 12h expiración)
const studentSessions = new Map();  // token → { studentId, expiresAt }
const teacherSessions = new Set();  // tokens (sin expiración)
```

### Rutas API (server.mjs)

| Método | Ruta | Auth | Request | Response |
|--------|------|------|---------|----------|
| GET | `/api/health` | — | — | info del servidor |
| GET | `/api/students` | — | — | array de estudiantes (sin pinHash) |
| POST | `/api/students/:id/pin/setup` | — | `{pin}` | `{student, token, expiresAt}` |
| POST | `/api/students/:id/login` | — | `{pin}` | `{student, token, expiresAt}` |
| GET | `/api/readings` | student | `?grade=N&studentId=X` | readings con locked/current/completed |
| POST | `/api/attempts` | student | `{studentId, readingId, transcript, elapsedSeconds, warmupAnswer, comprehensionAnswer}` | `{attempt, student, skillAward}` |
| POST | `/api/students/:id/skin` | student | `{skin}` | student actualizado |
| POST | `/api/students/:id/purchase` | student | `{part, value}` | student actualizado |
| POST | `/api/students/:id/sticker-pack` | student | `{}` | `{student, results[], pityTriggered}` |
| POST | `/api/students/:id/refuge/upgrade` | student | `{part}` | student actualizado |
| POST | `/api/students/:id/daily-reward` | student | `{}` | `{student, reward}` |
| GET/POST | `/api/students/:id/trades` | student | — / `{toStudentId, offeredKey, requestedKey}` | trades |
| POST | `/api/students/:id/trades/:id/respond` | student | `{decision}` | trade |
| POST | `/api/minigames/start` | student | `{studentId}` | `{token, payload}` (firmado) |
| POST | `/api/minigames/submit` | student | `{token, score, ...}` | attempt |
| POST | `/api/teacher/login` | — | `{pin}` | `{token, teacher}` |
| GET | `/api/teacher/summary` | teacher | — | `{teacher, classStats, students[]}` |
| GET | `/api/teacher/export.csv` | teacher | — | CSV |
| POST | `/api/teacher/students/:id/set-pin` | teacher | `{pin}` | student |
| POST | `/api/teacher/students/:id/reset-pin` | teacher | `{}` | student |
| POST | `/api/teacher/students` | teacher | `{name}` | student (crear) |
| POST | `/api/teacher/students/bulk` | teacher | `{names[]}` | 409 (bloqueado) |

---

## 3. WORKER CLOUDFLARE (`cloudflare/worker.mjs` — 1948 líneas)

### Arquitectura
**Single-file bundle** (esbuild) que incluye:
1. Seed store inline (línea 5-1408): objeto JS con 38 estudiantes, teacher, 4 attempts
2. `loot.mjs` inline (línea 1410-1435): `pickWeighted`, `pickRarity`, `nextPityState`
3. Código del worker (línea 1437-1948): router, auth, scoring, API handlers

### D1 State Management
```js
// Load: SELECT del JSON blob + normalize + parse
async function loadState(env) {
  let row = await env.DB.prepare(
    "SELECT version, data FROM app_state WHERE id = ?1"
  ).bind(APP_STATE_ID).first();
  if (!row) {
    // Primer inicio: clonar seed + INSERT OR IGNORE
    const data = JSON.stringify(normalizeStore(structuredClone(seed_store_default)));
    await env.DB.prepare("INSERT OR IGNORE INTO app_state ...").bind(...).run();
  }
  return { version: Number(row.version), store: normalizeStore(JSON.parse(row.data)) };
}

// Mutate: optimistic locking con retry (hasta 5 intentos)
async function mutateState(env, mutator) {
  for (let retry = 0; retry < 5; retry++) {
    const { version, store } = await loadState(env);
    const result = await mutator(store);
    const update = await env.DB.prepare(
      "UPDATE app_state SET data = ?1, version = version + 1, updated_at = ?2 WHERE id = ?3 AND version = ?4"
    ).bind(JSON.stringify(store), new Date().toISOString(), APP_STATE_ID, version).run();
    if (Number(update.meta?.changes || 0) === 1) return result;
  }
  throw new Error("La guarida recibió dos avances al mismo tiempo.");
}
```

### CORS
```js
const corsHeaders = (extra = {}) => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Class-Code",
  "Access-Control-Max-Age": "86400",
  ...extra
});
```

### PIN Hashing (Web Crypto API)
```js
async function derivePinHash(pin, salt) {
  const key = await crypto.subtle.importKey("raw",
    new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(salt), iterations: 100000 },
    key, 256);
  return bytesToHex(new Uint8Array(bits));
}
```

### Carga de Lecturas (desde ASSETS)
```js
let readingsPromise;
async function getReadings(env, request) {
  if (!readingsPromise) {
    readingsPromise = env.ASSETS.fetch(
      new Request(new URL("/content.json", request.url))
    ).then(async (response) => (await response.json()).readings);
  }
  return readingsPromise;  // singleton cache
}
```

### Config (`wrangler.jsonc`)
```json
{
  "name": "lectoguarida-conny",
  "main": "cloudflare/worker.mjs",
  "compatibility_date": "2026-06-21",
  "routes": [
    { "pattern": "www.lectoguarida.cl", "custom_domain": true },
    { "pattern": "lectoguarida.cl", "custom_domain": true }
  ],
  "assets": { "directory": "./public", "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/descargar-apk"]
  },
  "d1_databases": [{
    "binding": "DB",
    "database_name": "lectoguarida-db",
    "database_id": "74acba1e-b3b6-46a5-b9fc-3e53df02783d"
  }],
  "vars": { "TEACHER_NAME": "Conny" }
}
```

### Schema D1 (`cloudflare/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS teacher_sessions (
  token TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS student_sessions (
  token TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_student_sessions_expires ON student_sessions(expires_at);
```

---

## 4. MODELO DE DATOS COMPLETO

### Student
```typescript
interface Student {
  id: string;                    // "student-leon-osorio"
  name: string;                  // "León Osorio"
  grade: number;                 // 2
  avatar: string;                // emoji
  skin: {
    archetype: string;           // "axolotl" | "cosmic-cat" | ...
    palette: string;             // "coral" | "aqua" | ...
    outfit: string;              // "explorer" | "reader" | ...
    accessory: string;           // "star-glasses" | ...
    companion: string;           // "firefly" | ...
  };
  xp: number;
  coins: number;
  unlocked: string[];            // ["archetype:axolotl", "palette:coral", ...]
  streak: number;
  longestStreak: number;
  lastActiveDate: string;        // "YYYY-MM-DD" | ""
  stickers: Record<string, number>;  // { [stickerId]: count }
  packsOpened: number;
  packsSinceRare: number;
  pinSalt: string;               // hex string (16 bytes)
  pinHash: string;               // hex string (32 bytes PBKDF2)
  exchangeStars?: number;
  refuge?: Record<string, number>;  // { library: 3, garden: 1, observatory: 0, musicRoom: 0 }
  lastDailyRewardDate?: string;
  skillProgress?: Record<string, Skill>;
  createdAt: string;             // ISO timestamp
}

interface Skill {
  id: string;                    // reading id
  label: string;                 // skill name
  oa: string;                    // curriculum OA code
  domain: string;                // "Letras" | "Doble consonante" | "Fluidez" | ...
  points: number;                // 0-12
  level: 1 | 2 | 3;
  activities: number;            // 3
  lastScore: number;             // 0-100
  updatedAt: string;
  newlyUnlocked?: boolean;
  leveledUp?: boolean;
}
```

### Attempt
```typescript
interface Attempt {
  id: string;                    // UUID
  studentId: string;
  readingId: string;
  readingTitle: string;
  transcript: string;            // max 1000 chars
  elapsedSeconds: number;        // clamped 10-600
  warmupAnswer: string;
  comprehensionAnswer: string;
  scores: Scores;
  createdAt: string;
}

interface Scores {
  accuracy: number;              // 0-100 (LCS)
  wpm: number;                   // words per minute
  warmup: number;                // 0 | 100
  comprehension: number;         // 0 | 100
  overall: number;               // 0-100 (weighted)
  correctWords: number;
  totalWords: number;
  focus: string[];               // ["Sonido R", "Continuidad lectora", ...]
  xp: number;
  coins: number;
  message: string;
  streakBonus?: number;
}
```

### Reading
```typescript
interface Reading {
  id: string;                    // "g2-cometa-plaza"
  grade: 1 | 2;
  week?: number;                 // 1-3 (grado 1)
  day?: number;                  // 1-5
  title: string;
  world: string;                 // "Isla de las Letras" | ...
  skill: string;
  text: string;                  // texto de lectura
  warmup: {
    mode?: 'tap' | 'write' | 'build';
    prompt: string;
    options?: { id: string; label: string; icon: string }[];
    correct: string;
    skill?: string;
  };
  comprehension: {
    prompt: string;
    options: { id: string; label: string; icon: string }[];
    correct: string;
  };
  curriculum?: {
    fluencyOA: string;           // OA de fluidez
    supportOA: string;           // OA de apoyo
    transversal: { category: string; theme: string; objective: string };
  };
  stage?: string;                // "Letras" | "Doble consonante" | "Fluidez" | ...
  focusSymbol?: string;          // "A" | "B" | "PL" | "⚡" | ...
  order?: number;                // orden dentro del grade
  // Campos dinámicos (agregados por API):
  level?: number;
  expedition?: number;
  challenge?: string;
  attempts?: number;
  completed?: boolean;
  locked?: boolean;
  current?: boolean;
}
```

---

## 5. CATÁLOGOS DE CONTENIDO

### SKIN_CATALOG (30 archetypes, 12 palettes, 15 outfits, 18 acc, 15 comp)
```js
{
  archetype: ['axolotl','capybara','cosmic-cat','garden-dino','pastel-panda','forest-fox',
    'cardboard-robot','rainbow-unicorn','artist-octopus','library-owl','music-frog','bubble-dragon',
    'space-rabbit','river-otter','hummingbird','sea-turtle','mountain-llama','happy-pudu',
    'star-whale','koala-reader','chinchilla','red-panda','friendly-bee','sleepy-sloth',
    'moon-bat','little-penguin','wise-huemul','curious-vizcacha','magic-seal','tiny-alpaca'],
  palette: ['coral','aqua','violet','gold','mint','sky','rose','ocean','sunset','lime','lavender','cocoa'],
  outfit: ['explorer','reader','artist','scientist','gardener','musician','astronomer',
    'veterinarian','chef','cartographer','storyteller','meteorologist','paleontologist','dancer','builder'],
  accessory: ['star-glasses','flower-crown','headphones','backpack','scarf','cap',
    'binoculars','telescope','magnifier','compass','leaf-pin','comet-pin',
    'rainbow-boots','magic-pencil','camera','book-hat','shell-necklace','planet-ring'],
  companion: ['firefly','cloud','star','book-sprite','butterfly','mini-comet',
    'mini-hummingbird','mini-pudu','mini-penguin','mini-otter','mini-turtle',
    'mini-llama','mini-bee','fox-cub','mini-whale']
}
```

### Precios
```js
const SHOP_PRICES = { archetype: 150, palette: 60, outfit: 100, accessory: 80, companion: 120 };
// shopPrice(part, value) = index <= 0 ? 0 : SHOP_PRICES[part] + (index - 1) * 5
// Primer item de cada categoría es GRATIS
```

### Stickers: 7 sets × 10-12 = 72 stickers
| Set | Items | Comunes | Raros | Legendarios |
|-----|-------|---------|-------|-------------|
| Humedales de Chile | 10 | 7 | 2 | 1 |
| Cuerpo y bienestar | 10 | 7 | 2 | 1 |
| Agua y clima | 10 | 7 | 2 | 1 |
| Paisajes de Chile | 10 | 7 | 2 | 1 |
| Pueblos y memorias | 10 | 7 | 2 | 1 |
| Universo lector | 10 | 7 | 2 | 1 |
| Clásicos de la Guarida | 12 | 6 | 4 | 2 |

### Loot Table (Stickers)
```js
const LOOT_TABLE = [
  { id: 'common',    weight: 90 },   // 90%
  { id: 'rare',      weight: 9 },    // 9%
  { id: 'legendary', weight: 1 }     // 1%
];
// Pity: cada 5 packs garantiza rare/legendary
// Duplicate refund: common=4, rare=8, legendary=15 coins
```

### Challenge Modes (ciclan cada intento)
```js
['Exploración', 'Eco preciso', 'Ritmo', 'Voces de personaje', 'Detective de pistas', 'Guardián de la fluidez']
```

### Lecturas
- **15** misiones de 1.º básico (3 semanas × 5 días)
- **15** misiones de fluidez 2.º básico (3 semanas × 5 días)
- **26** cartilla fonética (letras a-z con ñ, k, w, x)
- **15** clústeres consonánticos (pl, pr, bl, br, cl, cr, fl, fr, gl, gr, tr, dr, ch, ll, rr)
- **28** currículo transversal (Lenguaje 15, Ciencias 8, Chile 7, Intercultural 11)
- **Total**: ~99+ misiones, 315 actividades

---

## 6. SCRIPTS DE BUILD

| Script | Comando | Qué hace |
|--------|---------|----------|
| `build:world3d` | `node tools/build-world3d.mjs` | esbuild world3d/World3DMap.jsx → public/world3d.bundle.js |
| `export:android` | `node tools/export-content.mjs && node tools/sync-android-assets.mjs` | Exporta readings a content.js/content.json + copia a android/ |
| `build:apk` | `tools/build-apk-portable.ps1` | Build completo APK (JDK + Gradle + SDK automático) |
| `cloudflare:prepare` | `build:world3d + export-content + prepare-cloudflare` | Prepara assets + seed para deploy |
| `cloudflare:deploy` | `cloudflare:prepare + wrangler deploy` | Deploy a Cloudflare |
| `configure:remote` | `node tools/configure-remote-api.mjs <URL>` | Cambia URL de API remota |

---

## 7. FLUJO DE AUTENTICACIÓN (Estudiante)

```
1. Home → "Soy estudiante" → classLoginView()
2. Ingresa código de curso → loginClass() → POST código → valida → studentsView()
3. Selecciona estudiante → student.hasPin ?
   ├── true  → pinMode='login'  → ingresa PIN → POST /login → token → enterStudentSession()
   └── false → pinMode='setup'  → ingresa PIN
                   → pinMode='confirm' → repite PIN
                   → coincide? → POST /pin/setup → token → enterStudentSession()
4. enterStudentSession():
   - Guarda student/token en sessionStorage
   - GET /api/readings?grade=2&studentId=X
   - state.view = 'map'
```

---

## 8. FLUJO DE MISIÓN (Lectura)

```
1. MapView → click level node → missionView()
2. missionView: briefing, curriculum, rewards
3. "Comenzar" → warmupView()
   - Según reading.warmup.mode:
     - 'tap': seleccionar opción
     - 'write': escribir texto
     - 'build': drag & drop tiles de letras
4. "Encender la runa" → readingView()
   - Texto con karaoke (word highlighting)
   - Mic toggle → Web Speech API + MediaRecorder
   - Timer (MM:SS)
   - "Probar lectura" carga texto sample
   - "Ya terminé" → comprehensionView()
5. comprehensionView()
   - Drag character a scene card (o tap)
   - "Activar la pista" → submitAttempt()
6. submitAttempt() POST /api/attempts → resultView()
   - Score ring + stats + XP/coins + skill unlock
   - rewardJuice() si overall >= 85
```

---

## 9. PERFIL DEMO (`teacher-demo-conny`)

Backdoors en worker.mjs:
```js
// Todas las lecturas desbloqueadas
if (studentId === "teacher-demo-conny") {
  return json(pool.map((reading, index) => ({
    ...reading, locked: false, current: index === 0
  })));
}

// PIN setup permite re-set aunque ya tenga PIN
if (student2.pinHash && student2.id !== "teacher-demo-conny")
  return { error: "Este perfil ya tiene PIN.", status: 400 };

// Login acepta "1234" siempre
if (hash2 !== student2.pinHash && !(student2.id === "teacher-demo-conny" && body2.pin === "1234"))
  return { error: "PIN incorrecto", status: 401 };
```

---

## 10. NOTAS TÉCNICAS IMPORTANTES

### Convenciones de Código
- **Sin TypeScript**: Todo JavaScript vanilla
- **Sin linter/formatter config**: No hay eslint, prettier, etc.
- **Sin comments**: Código sin comentarios (estilo adoptado)
- **Variables en español**: `state`, `lectura`, `calentamiento`, `comprension`
- **Módulos ES**: `"type": "module"` en package.json
- **Encoding**: UTF-8 con caracteres escapados (\u00F3 para ó, etc.)

### Diferencias server.mjs vs worker.mjs
| Aspecto | server.mjs | worker.mjs |
|---------|-----------|------------|
| Runtime | Node.js | Cloudflare Workers |
| Persistencia | Archivo JSON (data/store.json) | D1 (SQLite via Cloudflare) |
| Sesiones | Map/Set en memoria | Tablas D1 |
| PIN hashing | pbkdf2Sync (Node crypto) | crypto.subtle.deriveBits (Web Crypto) |
| Lecturas | Array inline en el archivo | Fetch desde ASSETS (/content.json) |
| Catálogos | Arrays grandes (30 archetypes, etc.) | Arrays pequeños (12 archetypes, etc.) |

### Deuda Técnica Identificada
1. **Sin tests de API**: Solo existen tests de scoring y loot
2. **Duplicación**: server.mjs y worker.mjs tienen lógica duplicada (scoring, rutas)
3. **Sin CI/CD**: Despliegue manual con wrangler
4. **Sin manejo de errores consistente**: Los errores de red en frontend no se capturan globalmente
5. **Sin normalización de DB**: D1 usa JSON blob en lugar de tablas normalizadas
6. **Sesiones sin verificación**: El worker crea student_sessions pero nunca las verifica en rutas
7. **Mapa 3D externalizado**: world3d.bundle.js es un bundle separado con API global
8. **Sin i18n**: Solo español chileno hardcodeado
9. **CORS abierto**: `Access-Control-Allow-Origin: *`
10. **Seguridad docente**: PIN del teacher en texto plano (local) o env var (Cloudflare)
