# Privacidad de Datos de Aprendizaje — FASE 2

**Fecha**: 2026-07-20
**Estado**: Basado en código implementado
**Rama**: `feature/lectoguarida-puerto-learning-vertical-v1`

---

## Datos Registrados

Los siguientes datos se almacenan en `localStorage` bajo el namespace `lectoguarida.learning.v1:{studentId}`:

### StudentId (seudónimo)
- Identificador generado por el sistema de perfiles existente
- No es nombre real
- No es RUT
- No es correo

### SessionId
- Formato: `session_{timestamp}_{random}`
- Generado al crear `LearningRuntime`
- No se persiste en localStorage (solo en memoria de la sesión actual)

### Datos de Evidencia (por intento)
- `skillId` — ID de la habilidad (ej: `phonological_initial_sound_identification`)
- `missionId` — ID de la misión (ej: `puerto-initial-m-01`)
- `challengeId` — ID del desafío (ej: `initial-sound-detector`)
- `evidenceType` — Tipo de evidencia (ej: `initial_sound_selection`)
- `stimulusId` — ID del estímulo (wordId de word-bank)
- `responseId` — ID de la respuesta seleccionada
- `correct` — Booleano: si la respuesta fue correcta
- `independent` — Booleano: si fue sin ayuda
- `difficulty` — Nivel de dificultad (`apoyo`, `estandar`, `desafio`)
- `responseMs` — Tiempo de respuesta en milisegundos
- `hintsUsed` — Número de pistas usadas
- `audioRepetitions` — Número de repeticiones de audio

### Datos de Progreso (por misión)
- `missionId` — ID de la misión
- `status` — Estado de la misión (`active`, `completed`)
- `startedAt` — Timestamp de inicio
- `completedAt` — Timestamp de finalización
- `roundsCompleted` — Rondas completadas
- `finalMastery` — Nivel de dominio final

### Datos de Habilidad (por habilidad)
- `skillId` — ID de la habilidad
- `status` — Estado (`not_started`, `started`, `in_progress`, `mastered`)
- `mastery` — Nivel de dominio (0-1)
- `attempts` — Total de intentos
- `correct` — Intentos correctos
- `independentCorrect` — Intentos correctos sin ayuda
- `consecutiveCorrect` — Correctas consecutivas actuales
- `averageResponseMs` — Tiempo promedio de respuesta
- `hintsUsed` — Total de pistas usadas
- `audioRepetitions` — Total de repeticiones de audio

### Resumen de Evidencia
- `total` — Total de eventos de evidencia
- `correct` — Eventos correctos
- `bySkill` — Desglose por habilidad

### Recompensas Desbloqueadas
- Lista de IDs de recompensas (ej: `insignia-puerto-sonido-m`)

### Cambios Persistentes del Mundo
- Lista de IDs de cambios (ej: `crane-activated`)

---

## Datos NO Registrados

El sistema de aprendizaje **no registra**:

| Dato | Justificación |
|------|---------------|
| Nombre real | Solo se usa studentId seudónimo |
| Audio o voz | Las funciones de audio son del sistema existente, no se almacenan |
| IP | No se accede a la IP |
| Geolocalización | No se accede a GPS ni geolocalización |
| Chat | No existe funcionalidad de chat |
| Fotografía | No se capturan imágenes |
| Texto libre sensible | No hay campos de texto libre que se guarden |
| Identificadores publicitarios | No se usan IDs de publicidad |
| Diagnóstico médico | No se almacena información de salud |
| RUT o documento de identidad | No se solicita |
| Correo electrónico | No se solicita |
| Datos de audio/voz en learning | `FORBIDDEN_FIELDS` en MetricsCollector lo bloquea |

---

## Almacenamiento

### Namespace
```
lectoguarida.learning.v1:{studentId}
```

### Almacenamiento actual
- `localStorage` del navegador
- Tolerante a datos corruptos (retorna defaults si falla la lectura)
- Tolerante a `localStorage` lleno o no disponible (usa objeto en memoria)

### Separación
- Namespace separado del modo colaborativo (`lectoguarida:solo-progress:v1`)
- Namespace separado de métricas (`lectoguarida:solo-metrics:v1`)

---

## Recuperación ante Datos Corruptos

```javascript
// En learning-progress-adapter.js → load()
try {
  var raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createDefault();
  var parsed = JSON.parse(raw);
  if (parsed && parsed.schemaVersion === 1 && parsed.studentId === studentId) {
    return parsed;
  }
  return createDefault();
} catch (e) {
  return createDefault();
}
```

Si los datos son corruptos o no válidos, se crea un estado por defecto sin lanzar errores.

---

## Eliminación

- `reset()` elimina todos los datos del namespace del estudiante
- `destroy()` marca el adapter como destruido y deja de persistir
- No existe función de eliminación global (cada estudiante se gestiona individualmente)

---

## Versionado

- `schemaVersion: 1` — Versión actual del esquema de persistencia
- El sistema verifica `schemaVersion === 1` al cargar
- Si la versión no coincide, retorna defaults

---

## Limitaciones

1. **localStorage es local**: Los datos no se sincronizan entre dispositivos
2. **Sin respaldo remoto**: No hay servidor de respaldo
3. **Tamaño limitado**: localStorage tiene límite de ~5MB por dominio
4. **Sin cifrado**: Los datos se almacenan en texto plano
5. **Sin anonymización**: El studentId es seudónimo pero no está cifrado

---

## Revisión Pendiente

- [ ] Revisión jurídica del cumplimiento de Ley de Protección de Datos Personales (Chile)
- [ ] Evaluación de consentimiento informado para menores
- [ ] Definición de política de retención de datos
- [ ] Evaluación de solicitud de eliminación por parte del titular
