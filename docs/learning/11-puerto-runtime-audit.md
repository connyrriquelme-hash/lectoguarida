# Auditoría Runtime — Puerto de los Gigantes (FASE 2)

**Fecha**: 2026-07-20
**Rama**: `feature/lectoguarida-puerto-learning-vertical-v1`
**Base**: `6e6bfb4`

---

## 1. APIs Reexistentes Auditadas

### 1.1 SoloProgressRepository

**Archivo**: `public/expedicion/solo/core/progress-repository.js`
**Tipo**: IIFE global, expuesta en `window.SoloProgressRepository` y `module.exports`
**Namespace localStorage**: `lectoguarida:solo-progress:v1:{studentProfileId}`

| Método | Firma | Retorna |
|--------|-------|---------|
| `load` | `(studentProfileId) → object` | Objeto de progreso completo |
| `save` | `(studentProfileId, data) → void` | — |
| `getProfileProgress` | `(studentProfileId, readerProfile) → object` | Datos del perfil (non_reader/beginner/advanced) |
| `updateProfileProgress` | `(studentProfileId, readerProfile, update) → void` | — |
| `updateProfile` | `(studentProfileId, readerProfile, patch) → void` | — |
| `addLostPages` | `(studentProfileId, amount) → number` | Total de páginas perdidas |
| `getLostPages` | `(studentProfileId) → number` | — |
| `completeGame` | `(studentProfileId, readerProfile, gameId, stars) → void` | — |
| `addReward` | `(studentProfileId, readerProfile, reward) → void` | — |
| `markGameCompleted` | `(studentProfileId, readerProfile, gameId, result) → void` | — |
| `resetProfile` | `(studentProfileId, readerProfile) → void` | — |
| `createDefaultProgress` | `(studentProfileId) → object` | Estructura default |

**Estructura por perfil**:
```json
{
  "currentWorld": 1,
  "completedGames": [],
  "stars": {},
  "skillProgress": {},
  "rewards": []
}
```

**Reutilizable**: Sí. El adapter de progreso del motor V2 (`createProgressAdapter` en `engine-v2-entry.js`) ya encapsula esta API. Se creará `LearningProgressAdapter` que delegue a `SoloProgressRepository` con namespace separado `lectoguarida.learning.v1`.

### 1.2 RewardManager

**Archivo**: `public/expedicion/solo/core/reward-manager.js`
**Tipo**: IIFE global, `window.RewardManager`

| Método | Firma | Descripción |
|--------|-------|-------------|
| `awardLostPages` | `(studentProfileId, amount) → number` | Otorga páginas perdidas |
| `awardStars` | `(studentProfileId, readerProfile, gameId, stars) → void` | Otorga estrellas |
| `awardBadge` | `(studentProfileId, readerProfile, badgeId) → void` | Otorga badge |

**Reutilizable**: Sí. Se creará `LearningRewardAdapter` que delegue a `RewardManager` para badges y a `SoloProgressRepository` para recompensas de aprendizaje.

### 1.3 MetricsCollector

**Archivo**: `public/expedicion/solo/core/metrics-collector.js`
**Tipo**: IIFE local (no global), localStorage `lectoguarida:solo-metrics:v1`

**Mapa de dominios** (extraído):
```
initial-sound-detector → phonological_awareness / initial_sound
rhyme-catcher → phonological_awareness / rhyme
syllable-counter → phonological_awareness / syllable
final-sound-catcher → phonological_awareness / final_sound
```

**FORBIDDEN_FIELDS**: `['password', 'token', 'secret', 'email', 'phone', 'address', 'ip', 'location', 'audio', 'voice', 'realName']`

**Reutilizable**: Sí. El `EvidenceCollector` generará eventos con `evidenceType` que mapean al mismo dominio/habilidad. No se modifica MetricsCollector.

### 1.4 engine-v2-entry.js

**Archivo**: `public/expedicion/solo/game-engine/engine-v2-entry.js`
**Función**: `createGameEngineV2(options) → { initialize, start, pause, resume, destroy, getEngine, getContext }`

**Adaptadores que crea**:
- `legacyInputAdapter` — joystick/WASD/click
- `legacyCameraAdapter` — cámara
- `legacyNarrativeAdapter` — narrativa/dialogo
- `legacyAudioAdapter` — audio
- `legacyChallengeAdapter` — apertura de minijuegos
- `legacyProgressAdapter` — progreso via SoloProgressRepository

**Dependencias inyectadas** (options.deps):
- `THREE`, `AudioManager`, `SoloGameAdapter`, `SoloProgressRepository`
- `joystick`, `wasd`, `clickToMove`
- `narrativePanel`, `captionController`, `dialogueManager`

**Escena por defecto**: `plaza-guarida`

**Punto de integración para learningV1**: Línea 43-71 (initialize). Cuando `learningV1=1`, se creará `LearningRuntime` en lugar de los adaptadores legacy de challenge/progress. Los adaptadores de input/camera/audio/narrative permanecen.

### 1.5 EventBus

**Archivo**: `public/expedicion/solo/game-engine/core/event-bus.js`
**Función**: `createEventBus() → { on, once, off, emit, clearScope, clear, listenerCount }`

**Eventos existentes en el código**:
- `scene:loading`, `scene:loaded`, `scene:unloading`
- `entity:created`, `entity:destroyed`
- `engine:ready`
- `quest:challenge-complete` (emitido por legacyChallengeAdapter)

**Eventos que agregará LearningRuntime**:
- `learning:evidence-created`
- `learning:mission-started`
- `learning:mission-completed`
- `learning:mastery-reached`
- `learning:reward-awarded`
- `learning:world-change`

### 1.6 QuestSystem

**Archivo**: `public/expedicion/solo/game-engine/systems/systems.js` (línea 145)
**Función**: `createQuestSystem() → { componentId: 'QuestSystem', update }`
**Tipo**: Sistema ECS del motor V2. No se modifica.

### 1.7 SaveSystem

**Archivo**: `public/expedicion/solo/game-engine/systems/save-system.js`
**Función**: `createSaveSystem() → { componentId: 'SaveSystem', save, load, update }`
**Dependencia**: `context.progress.saveAdventure(data)` / `context.progress.loadAdventure()`

**Reutilizable**: Sí. `LearningProgressAdapter` implementará la misma interfaz `save/load` que espera SaveSystem.

### 1.8 Legacy Challenge Adapter (engine V2)

**Archivo**: `public/expedicion/solo/game-engine/adapters/legacy-challenge-adapter.js`
**Función**: `createLegacyChallengeAdapter({ context, SoloGameAdapter, AudioManager, studentProfileId, difficulty, container, onComplete })`

**Comportamiento**:
1. Llama a `SoloGameAdapter.createEngine({ studentProfileId, container, gameId, difficulty })`
2. Suscribe al state machine: `engine.getStateMachine().subscribe(callback)`
3. En `GAME_COMPLETE`: extrae score del scoring, calcula estrellas (≥200→3, ≥100→2, sino→1), llama `onComplete`
4. En `GAME_FAILED`: llama `onComplete({ completed: false })`

**Resultado del minijuego**:
```json
{
  "completed": true,
  "gameId": "initial-sound-detector",
  "missionId": "...",
  "score": 150,
  "stars": 2,
  "attempts": 1,
  "rewardId": null,
  "nextMissionId": null
}
```

**No se modifica**. Se creará `LearningChallengeAdapter` que intercepte el resultado y lo traduzca a evidencia de aprendizaje.

### 1.9 initial-sound-detector.js

**Archivo**: `public/expedicion/solo/games/non-reader/initial-sound-detector.js`
**Tipo**: IIFE, se registra con `SoloGameAdapter.registerGame`

**GAME_CONTENT** (5 rondas hardcodeadas):
- Ronda 1: "MANZANA" → opciones: M, S, L → correcta: M
- Ronda 2: "SOL" → opciones: S, M, L → correcta: S
- Ronda 3: "FAMILIA" → opciones: F, M, P → correcta: F
- Ronda 4: "CASA" → opciones: C, S, L → correcta: C
- Ronda 5: "OJO" → opciones: O, A, U → correcta: O

**Template**: `ClickSelectionTemplate`
**Resultado por ronda**: `{ correct: boolean, selected: string, correctAnswer: string, question: string }`
**Resultado final**: `{ score: number, attempts: number, totalRounds: number, correctCount: number }`

**No se reescribe**. Se creará adapter que:
1. Inyecte rondas dinámicas desde `stimulus-set` (reemplazando GAME_CONTENT)
2. Capture cada respuesta para generar evidencia
3. Capture el resultado final para mastery

### 1.10 ClickSelectionTemplate

**Archivo**: `public/expedicion/solo/templates/click-selection-template.js`

**API**: `ClickSelectionTemplate.create(config, container) → { engine, start, destroy }`
**Config**: `{ rounds: [{ question, options: [{text, value}], correctValue, audioUrl? }], instructions: { text }, onComplete: (result) => void }`

**No se modifica**.

---

## 2. Puerto de los Gigantes

**Archivo**: `public/expedicion/solo/adventure/adventure-config.js`

| Campo | Valor |
|-------|-------|
| Region ID | `puerto-gigantes` |
| Region name | `Puerto de los Gigantes` |
| State | `LOCKED` |
| Position | `{ x: -240, y: 80 }` |
| Future zones | `muelle-colorido`, `fabrica-cajas`, `faro-rompeolas` |
| World ID (learning) | `puerto_gigantes` |

---

## 3. Chispa

**Archivo**: `public/expedicion/solo/adventure/adventure-config.js`

| Campo | Valor |
|-------|-------|
| ID | `chispa` |
| Name | `Chispa` |
| Species | `Chucao de los Sonidos` |
| Fusion | `chucao-copihue` |
| Zone ID | `bosque-sonido` |
| Palette | primary: `0xff9f43`, secondary: `0x8b5a2b`, accent: `0xffe0b3` |

---

## 4. bosque-sonido

**Archivo**: `public/expedicion/solo/adventure/adventure-config.js`

| Campo | Valor |
|-------|-------|
| Zone ID | `bosque-sonido` |
| Name | `Bosque del Primer Sonido` |
| Color | `0x9ae66e` |
| Portal | true |
| Game ID | `initial-sound-detector` |
| Guardian ID | `chispa` |
| Position | `{ x: -30, z: 8 }` |
| Locked | true |
| Upcoming | true |

---

## 5. Métodos Reutilizables (resumen)

| Componente | Reutilizar | Acción |
|------------|-----------|--------|
| SoloProgressRepository | load/save/getProfileProgress/updateProfileProgress | Delegar via LearningProgressAdapter |
| RewardManager | awardBadge | Delegar via LearningRewardAdapter |
| EventBus | on/once/off/emit | Escuchar y emitir eventos learning:* |
| SaveSystem | save/load | LearningProgressAdapter implementa interfaz |
| ClickSelectionTemplate | create(config, container) | Adapter lo usa con rondas dinámicas |
| MetricsCollector | (lectura) | EvidenceCollector genera mismos campos |

---

## 6. Eventos Existentes (no crear duplicados)

| Evento | Emisor | Uso |
|--------|--------|-----|
| `scene:loading` | SceneManager | Carga de escena |
| `scene:loaded` | SceneManager | Escena cargada |
| `entity:created` | EntityManager | Entidad creada |
| `entity:destroyed` | EntityManager | Entidad destruida |
| `engine:ready` | GameEngine | Motor listo |
| `quest:challenge-complete` | LegacyChallengeAdapter | Desafío completado |

---

## 7. Forma Actual del Resultado del Minijuego

**Resultado por ronda** (ClickSelectionTemplate):
```json
{
  "correct": true,
  "selected": "M",
  "correctAnswer": "M",
  "question": "¿Con qué sonido empieza \"MANZANA\"?"
}
```

**Resultado final** (GAME_COMPLETE):
```json
{
  "score": 150,
  "attempts": 1,
  "totalRounds": 5,
  "correctCount": 4
}
```

---

## 8. Punto Mínimo de Integración

1. **engine-v2-entry.js** (línea 43-71): Cuando `learningV1=true`, crear `LearningRuntime` en lugar de `legacyChallengeAdapter` y `legacyProgressAdapter`. Input/camera/audio/narrative permanecen.
2. **initial-sound-detector.js**: No se modifica. Se intercepta vía adapter que inyecta rondas dinámicas.
3. **eventBus**: Se emiten eventos `learning:*` sin modificar el bus existente.

---

## 9. Archivos que Deberán Modificarse

| Archivo | Cambio |
|---------|--------|
| `engine-v2-entry.js` | Import condicional de LearningRuntime, creación cuando learningV1=true |
| `challenge-adapter.js` (adventure/) | No se modifica — se usa el de engine-v2-entry |

---

## 10. Archivos que Permanecerán Intactos

- `public/expedicion/solo/games/non-reader/initial-sound-detector.js`
- `public/expedicion/solo/core/progress-repository.js`
- `public/expedicion/solo/core/reward-manager.js`
- `public/expedicion/solo/core/metrics-collector.js`
- `public/expedicion/solo/templates/click-selection-template.js`
- `public/expedicion/solo/game-engine/core/event-bus.js`
- `public/expedicion/solo/game-engine/systems/save-system.js`
- `public/expedicion/solo/game-engine/systems/systems.js`
- `public/expedicion/solo/adventure/adventure-config.js`
- `public/expedicion/solo/adventure/adventure-engine.js`
- `public/expedicion/solo/adventure/quest-manager.js`
- `public/expedicion/solo/adventure/mission-manager.js`
- `world3d.bundle.js`
- Los 8 archivos protegidos (game.js, juego.html, juego-v2.html, environment-v2.js, environment-v2.css, auth.js, index.html, dashboard.html)
