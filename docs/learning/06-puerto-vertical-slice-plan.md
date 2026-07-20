# Plan de Slice Vertical — Puerto de los Gigantes

## Documento: 06-puerto-vertical-slice-plan.md

### Objetivo

Definir las 6 misiones de aprendizaje para el Puerto de los Gigantes, el primer mundo jugable del modo solo de Lectoguarida.

---

## 1. Contexto del Mundo

| Atributo | Valor |
|----------|-------|
| Nombre | Puerto de los Gigantes |
| Tema | Decodificación y fluidez |
| Nivel | 1° Básico |
| OA cubiertos | OA13-OA23 (Decodificación + Fluidez) |
| Dominios | `decoding`, `fluency` |
| Grafos | 12 nodos de decodificación, 8 de fluidez |

---

## 2. Misiones Definidas

### Misión 1: Sílabas Directas

| Campo | Valor |
|-------|-------|
| ID | `mision_silabas_directas` |
| Habilidad | `decoding_direct_syllables` |
| OA | LE01-OA-13 |
| Mastery Rule | `mastery_80_3_consecutive` |
| Contexto | Leer sílabas directas (ma, pe, si, to) |
| Transfer | Juego + texto + oral |

### Misión 2: Sílabas Inversas

| Campo | Valor |
|-------|-------|
| ID | `mision_silabas_inversas` |
| Habilidad | `decoding_inverse_syllables` |
| OA | LE01-OA-14 |
| Mastery Rule | `mastery_80_3_consecutive` |
| Contexto | Leer sílabas inversas (al, en, os, ur) |
| Transfer | Juego + texto |

### Misión 3: Sílabas Mixtas

| Campo | Valor |
|-------|-------|
| ID | `mision_silabas_mixtas` |
| Habilidad | `decoding_mixed_syllables` |
| OA | LE01-OA-15 |
| Mastery Rule | `mastery_80_3_consecutive` |
| Contexto | Leer sílabas mixtas (bra, clo, fre) |
| Transfer | Juego + texto |

### Misión 4: Dígrafos

| Campo | Valor |
|-------|-------|
| ID | `mision_digrafos` |
| Habilidad | `decoding_digraphs` |
| OA | LE01-OA-16 |
| Mastery Rule | `mastery_80_3_consecutive` |
| Contexto | Leer palabras con ch, ll, rr |
| Transfer | Juego + texto + oral |

### Misión 5: Fluidez Nivel 1

| Campo | Valor |
|-------|-------|
| ID | `mision_fluidez_nivel_1` |
| Habilidad | `fluency_accuracy` |
| OA | LE01-OA-20 |
| Mastery Rule | `mastery_95_accuracy` |
| Contexto | Lectura oral con precisión ≥95% |
| Transfer | Juego + texto + oral |

### Misión 6: Fluidez Nivel 2

| Campo | Valor |
|-------|-------|
| ID | `mision_fluidez_nivel_2` |
| Habilidad | `fluency_wpm_rate` |
| OA | LE01-OA-21 |
| Mastery Rule | `mastery_wpm_benchmarks` |
| Contexto | Velocidad lectora (WPM) |
| Transfer | Juego + texto |

---

## 3. Dependencias entre Misiones

```
Misión 1 (directas) → Misión 2 (inversas) → Misión 3 (mixtas) → Misión 4 (dígrafos)
                                                                  ↓
                                            Misión 5 (fluidez 1) → Misión 6 (fluidez 2)
```

### Nodo de Entrada

- **Primera misión accesible**: Misión 1 (sin prerequisites en el grafo)
- **Nodo raíz del grafo**: `decoding_direct_syllables`

---

## 4. Criterios de Dominio por Misión

| Misión | Mín. Intentos | Precisión | Consecutivos | Sesiones | Transferencia | Retención |
|--------|---------------|-----------|--------------|----------|---------------|-----------|
| 1-4 (decodificación) | 8 | 0.80 | 3 | 2 | 1 | 7d/70% |
| 5 (fluidez) | 20 | 0.95 | 5 | 3 | 2 | 14d/90% |
| 6 (WPM) | 15 | varía por nivel | - | 3 | 2 | 30d |

---

## 5. Banco de Palabras Asociado

| Misión | Categorías de palabras | Cantidad |
|--------|----------------------|----------|
| 1-4 | Palabras con sílabas directas/inversas/mixtas/dígrafos | ~120 del bank |
| 5-6 | Palabras de alta frecuencia para lectura oral | ~80 del bank |

### Distribución del Word Bank

- **Banda A** (200 palabras): Frecuentes, neutras → misiones 1-6
- **Banda B** (50 palabras): Contexto chileno → misiones 1-4
- **Banda C** (50 palabras): Mundo Lectoguarida → misiones 5-6

---

## 6. Validación

- Todas las misiones referencian `masteryRuleId` válido en `mastery-rules.json`
- Todas las habilidades referenciadas existen en `skill-domains.json`
- Mapeo curricular verificado contra OA del MEN Chile
