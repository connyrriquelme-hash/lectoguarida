# Eventos del Runtime de Aprendizaje — FASE 2

**Fecha**: 2026-07-20
**Estado**: Documentación basada en código implementado
**Rama**: `feature/lectoguarida-puerto-learning-vertical-v1`

---

## Eventos Implementados

### 1. `learning:evidence-created`

| Campo | Valor |
|-------|-------|
| **Productor** | `evidence-collector.js` → `createEvidenceCollector().createEvidence()` |
| **Consumidores** | Ninguno registrado en FASE 2 (extensible) |
| **Payload** | `{ evidence: { version, eventId, studentId, sessionId, skillId, missionId, challengeId, evidenceType, stimulusId, responseId, correct, independent, difficulty, responseMs, hintsUsed, audioRepetitions, context } }` |
| **Campos obligatorios** | `evidence.eventId` (string, formato `ev_`), `evidence.correct` (boolean), `evidence.evidenceType` (string) |
| **Persistencia** | No directa. El `LearningProgressAdapter.addEvidenceSummary()` se llama después por `MissionOrchestrator` |
| **Idempotencia** | Cada emisión genera un `eventId` único |
| **Datos sensibles** | No contiene audio, voz, IP, nombre real ni geolocalización |
| **Errores posibles** | Ninguno — el emisor captura errores internamente |

### 2. `learning:challenge-started`

| Campo | Valor |
|-------|-------|
| **Productor** | `initial-sound-learning-adapter.js` → `start()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ challengeId: string, rounds: number }` |
| **Campos obligatorios** | `challengeId` (string), `rounds` (number) |
| **Persistencia** | No |
| **Idempotencia** | Se emite una vez por inicio de desafío |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 3. `learning:answer-selected`

| Campo | Valor |
|-------|-------|
| **Productor** | `initial-sound-learning-adapter.js` → `processSelection()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ stimulusId, responseId, correct, responseMs, roundIndex, totalRounds }` |
| **Campos obligatorios** | `stimulusId` (string), `correct` (boolean), `responseMs` (number) |
| **Persistencia** | No directa — el adapter alimenta `MissionOrchestrator.processRoundResult()` |
| **Idempotencia** | Cada selección genera un resultado independiente |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 4. `learning:answer-result`

| Campo | Valor |
|-------|-------|
| **Productor** | `initial-sound-learning-adapter.js` → `processSelection()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ correct: boolean, stimulusId: string }` |
| **Campos obligatorios** | `correct` (boolean), `stimulusId` (string) |
| **Persistencia** | No |
| **Idempotencia** | Se emite por cada respuesta |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 5. `learning:challenge-completed`

| Campo | Valor |
|-------|-------|
| **Productor** | `initial-sound-learning-adapter.js` → `completeChallenge()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ completed: true, challengeId, score, totalRounds, correctCount, attempts, totalTimeMs }` |
| **Campos obligatorios** | `completed` (true), `challengeId` (string), `score` (number) |
| **Persistencia** | No directa |
| **Idempotencia** | Se emite una vez por desafío completado |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 6. `learning:challenge-abandoned`

| Campo | Valor |
|-------|-------|
| **Productor** | `initial-sound-learning-adapter.js` → `abandon()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ challengeId, roundsCompleted, totalRounds }` |
| **Campos obligatorios** | `challengeId` (string) |
| **Persistencia** | No |
| **Idempotencia** | Se emite una vez por abandono |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 7. `learning:mission-started`

| Campo | Valor |
|-------|-------|
| **Productor** | `mission-orchestrator.js` → `startMission()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ missionId: string, skillId: string }` |
| **Campos obligatorios** | `missionId` (string), `skillId` (string) |
| **Persistencia** | Se guarda `missionState` en `LearningProgressAdapter` antes del emit |
| **Idempotencia** | Se emite una vez por inicio de misión |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 8. `learning:round-completed`

| Campo | Valor |
|-------|-------|
| **Productor** | `mission-orchestrator.js` → `processRoundResult()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ missionId, round: number, correct: boolean, mastery: number }` |
| **Campos obligatorios** | `missionId` (string), `correct` (boolean), `mastery` (number) |
| **Persistencia** | Se guarda `skillState` y `evidenceSummary` antes del emit |
| **Idempotencia** | Se emite por cada ronda procesada |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 9. `learning:mission-completed`

| Campo | Valor |
|-------|-------|
| **Productor** | `mission-orchestrator.js` → `completeMission()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ missionId, mastery: number, rewardAwarded: boolean, worldChangeApplied: boolean }` |
| **Campos obligatorios** | `missionId` (string), `mastery` (number) |
| **Persistencia** | Se guarda `missionState` como `completed` antes del emit |
| **Idempotencia** | Se emite una vez por misión completada |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 10. `learning:mastery-reached`

| Campo | Valor |
|-------|-------|
| **Productor** | `mission-orchestrator.js` → `completeMission()` |
| **Consumidores** | Ninguno registrado en FASE 2 |
| **Payload** | `{ missionId, skillId, mastery: number }` |
| **Campos obligatorios** | `missionId` (string), `skillId` (string), `mastery` (number) |
| **Persistencia** | Ya persistida por `completeMission()` |
| **Idempotencia** | Se emite una vez por dominio alcanzado |
| **Datos sensibles** | No |
| **Errores posibles** | Ninguno |

### 11. `learning:world-change`

| Campo | Valor |
|-------|-------|
| **Productor** | `learning-world-adapter.js` → `applyWorldChange()` o `applyAll()` |
| **Consumidores** | El sistema gráfico (pendiente de conexión real en FASE 2.1) |
| **Payload** | `{ changeId: string, timestamp?: number, replay?: boolean }` |
| **Campos obligatorios** | `changeId` (string) |
| **Persistencia** | Se guarda en `persistentWorldChanges` en `LearningProgressAdapter` antes del emit |
| **Idempotencia** | `applyWorldChange()` verifica `hasWorldChange()` antes de persistir y emitir |
| **Datos sensibles** | No |
| **Errores posibles** | Si el receptor gráfico no existe, el evento se emite sin efecto visual |

---

## Eventos Pendientes (no implementados en FASE 2)

Los siguientes eventos fueron solicitados en el gate pero **no existen en el código actual**. Son pendientes para FASE 2.1+:

| Evento | Estado | Productor esperado |
|--------|--------|-------------------|
| `learning:runtime-ready` | No implementado | `learning-runtime.js` al inicializar |
| `learning:mission-loaded` | No implementado | `mission-orchestrator.js` al cargar datos |
| `learning:skill-updated` | No implementado | `student-model.js` o `mission-orchestrator.js` |
| `learning:difficulty-changed` | No implementado | `mastery-engine.js` o adaptador de dificultad |
| `learning:mission-needs-practice` | No implementado | `mastery-engine.js` cuando `nextAction=provide_support` |
| `learning:mission-mastered` | No implementado | Igual que `learning:mastery-reached` |
| `learning:reward-granted` | No implementado | `learning-reward-adapter.js` |
| `learning:save-completed` | No implementado | `learning-progress-adapter.js` |
| `learning:error` | No implementado | Cualquier módulo con try/catch |
| `learning:disposed` | No implementado | `learning-runtime.js` → `destroy()` |

---

## Eventos del Motor V2 (existentes, no modificados)

| Evento | Productor | Uso |
|--------|-----------|-----|
| `scene:loading` | SceneManager | Carga de escena |
| `scene:loaded` | SceneManager | Escena cargada |
| `entity:created` | EntityManager | Entidad creada |
| `entity:destroyed` | EntityManager | Entidad destruida |
| `engine:ready` | GameEngine | Motor listo |
| `quest:challenge-complete` | LegacyChallengeAdapter | Desafío completado (modo legacy) |
