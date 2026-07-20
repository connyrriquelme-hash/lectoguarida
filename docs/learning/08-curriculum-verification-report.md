# Reporte de Verificación Curricular

## Documento: 08-curriculum-verification-report.md

### Resumen

| Métrica | Valor |
|---------|-------|
| Total de mapeos | 50 |
| Mapeos verificados | 49 |
| Mapeos pendientes | 1 |
| Duplicados exactos eliminados | 3 (FASE 1.2) |
| OA code faltante | 0 |
| sourceUrl faltante (verified) | 0 |

---

## 1. Metodología

### Fuentes de Verificación

| Fuente | URL | Uso |
|--------|-----|-----|
| Bases Curriculares MEN Chile 2019 | curriculumnacional.cl | OA oficiales 1°-4° Básico |
| OA Priorizados COVID-19 | curriculumnacional.cl | OA priorizados |

### Criterios de Verificación

| Criterio | Significado |
|----------|-------------|
| `verified` | Mapeo confirmado contra fuente oficial, tiene `sourceUrl` y `oaCode` |
| `pending` | Mapeo razonable pero sin verificación explícita contra fuente |
| `pending_review` | Mapeo nuevo, requiere revisión humana |

---

## 2. Duplicados Eliminados (FASE 1.2)

| skillId | level | subject | oaCode | Acción |
|---------|-------|---------|--------|--------|
| `phonological_rhyme_identification` | 1_basico | Lenguaje | LE01-OA-05 | Eliminado (duplicado exacto) |
| `phonological_syllable_segmentation` | 1_basico | Lenguaje | LE01-OA-06 | Eliminado (duplicado exacto) |
| `phonological_initial_sound_identification` | 1_basico | Lenguaje | LE01-OA-07 | Eliminado (duplicado exacto) |

### justificación

Los mapeos eliminados eran entradas idénticas (mismo skillId + level + subject + oaCode). El mapeo conservado incluye `sourceUrl` completo.

---

## 3. Distribución por Dominio

| Dominio | Mapeos | OA Cubiertos |
|---------|--------|--------------|
| Conciencia Fonológica | 9 | OA05-OA09 |
| Principio Alfabético | 3 | OA10-OA12 |
| Decodificación | 7 | OA13-OA19 |
| Fluidez | 4 | OA20-OA23 |
| Vocabulario | 4 | OA24-OA27 |
| Comprensión Lectora | 4 | OA29-OA32 |
| Escritura | 5 | OA36-OA40 |
| Ortografía | 4 | OA42-OA45 |
| Lenguaje Oral | 4 | OA01-OA04 |

---

## 4. Mapeo Pendiente

| skillId | oaCode | Motivo |
|---------|--------|--------|
| `orthography_homophone_differentiation` | LE01-OA-46 | OA46 no verificado explícitamente en fuente oficial |

### Acción Requerida

Verificar OA46 contra Bases Curriculares 2019 antes de FASE 2.

---

## 5. Validación Automatizada

El validator (`validate-learning-data.js`) verifica:

1. Sin duplicados exactos (skillId + level + subject + oaCode)
2. Todos los mapeos `verified` tienen `sourceUrl`
3. Todos los mapeos `verified` tienen `oaCode`
4. Estados de verificación válidos: `verified`, `pending`, `pending_review`
