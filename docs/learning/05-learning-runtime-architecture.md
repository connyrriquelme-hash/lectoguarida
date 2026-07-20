# Arquitectura de Runtime del Learning System

## Documento: 05-learning-runtime-architecture.md

### Visión General

El runtime de aprendizaje de Lectoguarida opera como una capa overlay sobre el motor de juego V2, evaluando habilidades en tiempo real sin modificar el flujo narrativo del juego.

---

## 1. Componentes Principales

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `skill-graph.json` | `game-learning/data/` | Grafo acíclico dirigido (47 nodos) de progresión de habilidades |
| `skill-domains.json` | `game-learning/data/` | Registro canónico de 9 dominios y 46 habilidades con `masteryRuleId` |
| `mastery-rules.json` | `game-learning/config/` | 10 reglas de dominio con umbrales, rúbricas y bands de dificultad |
| `learner-profiles.json` | `game-learning/data/` | 8 perfiles de aprendizaje (nivel, preferencias, ritmo) |
| `feedback-messages-es-cl.json` | `game-learning/data/` | Mensajes de retroalimentación en español chileno (12 categorías, 0 punitivos) |
| `feedback-rules.json` | `game-learning/config/` | 14 reglas de activación de feedback |
| `word-bank-foundation.json` | `game-content/words/` | Banco de 300 palabras (A:200, B:50, C:50) |
| `chile-literacy-mapping.json` | `game-content/curriculum/` | 50 mapeos OA → habilidades |

### Schemas

| Schema | Valida |
|--------|--------|
| `learner-profiles.schema.json` | Perfiles de aprendizaje |
| `skill-graph.schema.json` | Grafo de habilidades (40-60 nodos) |
| `learning-mission.schema.json` | Misiones de aprendizaje |
| `student-skill-state.schema.json` | Estado de habilidad por estudiante |
| `learning-evidence.schema.json` | Evidencia de dominio |
| `word-entry.schema.json` | Entrada individual de palabra |
| `word-bank.schema.json` | Banco de palabras completo |

---

## 2. Flujo de Datos

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Game Engine │───→│ Event Bridge │───→│   Evaluator  │
│  (V2 legacy) │    │  (JS events) │    │  (mastery)   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                    ┌──────────────┐    ┌──────▼───────┐
                    │   Adaptive   │◄───│   Evidence   │
                    │   Engine     │    │   Collector  │
                    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────▼───────┐    ┌──────────────┐
                    │  Dashboard   │───→│   Teacher    │
                    │   (admin)    │    │   Override   │
                    └──────────────┘    └──────────────┘
```

### Ciclo de Evaluación

1. **Evento de juego**: El jugador realiza una acción (leer palabra, responder pregunta)
2. **Recolección de evidencia**: Se registra accuracy, hints, tiempo, contexto
3. **Evaluación de dominio**: Se compara contra la `masteryRuleId` de la habilidad
4. **Actualización de estado**: Se transiciona el estado de la habilidad
5. **Retroalimentación**: Se selecciona mensaje según `feedback-rules.json`
6. **Adaptación**: Se ajusta dificultad según `difficultyAdjustment`

---

## 3. Estados de Progreso

```
not_started → introduced → practicing → approaching_mastery → mastered
                              ↑              ↓                    ↓
                              │         needs_support     retention_due
                              │              ↓                    ↓
                              └──────────────┴────────────────────┘
```

### Transiciones Bloqueadas

- `mastered` → `not_started` (solo vía teacher override)
- `not_started` → `mastered` (sin pasar por `practicing`)
- Cualquier salto que omita `practicing`

---

## 4. Integración con Feature Flags

| Flag | Efecto |
|------|--------|
| `isGameEngineV2Enabled()` | Activa el motor V2 con runtime de aprendizaje |
| `?engineV2=1` (query param) | Override para testing |

El learning system solo opera cuando el engine V2 está activo.

---

## 5. Archivos de Configuración

| Archivo | Propósito | Modificable por |
|---------|-----------|-----------------|
| `mastery-rules.json` | Umbrales de dominio | Desarrollador |
| `feedback-rules.json` | Reglas de retroalimentación | Desarrollador |
| `difficultyBands` (en mastery-rules) | Niveles de dificultad | Desarrollador |
| `teacherOverrideRules` (en mastery-rules) | Permisos de override docente | Desarrollador |

### Auditoría

Todos los overrides docentes generan entrada de auditoría (`auditTrail: true`).
