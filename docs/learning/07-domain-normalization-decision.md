# Decisión de Normalización de Dominios

## Documento: 07-domain-normalization-decision.md

### Contexto

Durante FASE 1.1, se detectaron inconsistencias en la nomenclatura de dominios y habilidades entre `skill-graph.json`, `skill-domains.json`, y los schemas. Este documento documenta la decisión de normalización.

---

## 1. Problema Detectado

| Archivo | Nomenclatura previa | Nomenclatura normalizada |
|---------|--------------------|-----------------------|
| `skill-graph.json` | `phonological` | `phonological_awareness` |
| `skill-graph.json` | `alphabetic` | `alphabetic_principle` |
| `skill-graph.json` | `reading` | `reading_comprehension` |
| `skill-domains.json` | IDs mixtos | IDs con snake_case consistente |
| Schemas | `domain` | `domainId` |

### Causa Raíz

Los archivos fueron generados en sesiones distintas sin un contrato de nomenclatura compartido.

---

## 2. Decisión

### Regla de Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Domain IDs | `snake_case`, descriptivo | `phonological_awareness` |
| Skill IDs | `dominio_acción_objeto` | `phonological_rhyme_identification` |
| Schema fields | `camelCase` | `domainId`, `masteryRuleId` |
| JSON keys | `snake_case` | `minimumAccuracy`, `consecutiveCorrectRequired` |

### IDs Canonizados (14 cambios en FASE 1.1)

| ID Anterior | ID Canonizado |
|-------------|---------------|
| `phonological` | `phonological_awareness` |
| `alphabetic` | `alphabetic_principle` |
| `reading` | `reading_comprehension` |
| `oral` | `oral_language` |
| (8 más renombrados) | (ver skill-graph.json) |

---

## 3. Verificación Post-Normalización

| Check | Estado |
|-------|--------|
| Todos los graph nodes existen en skill-domains.json | ✅ |
| Todos los prerequisites/unlocks referencian IDs válidos | ✅ |
| Sin autorreferencias | ✅ |
| Sin ciclos en el grafo | ✅ |
| Todos los skills tienen `masteryRuleId` válido | ✅ |
| Todos los `masteryRuleId` existen en mastery-rules.json | ✅ |

---

## 4. Impacto

- **Sin breaking changes**: Los IDs anteriores nunca fueron committed
- **Sin migración necesaria**: El grafo fue reescrito completo en FASE 1.1
- **Validación continua**: `validate-learning-data.js` verifica consistencia en cada ejecución
