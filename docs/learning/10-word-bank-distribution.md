# Distribución del Banco de Palabras

## Documento: 10-word-bank-distribution.md

### Resumen

| Métrica | Valor |
|---------|-------|
| Total de palabras | 300 (exacto) |
| IDs únicos | 300 |
| Valores normalized únicos | 300 |
| Coherencia silábica | 100% |
| Imageable (≤3) | 94% (282/300) |
| Estado | Todas `pending_review` |

---

## 1. Distribución por Banda

| Banda | Cantidad | Descripción | Uso |
|-------|----------|-------------|-----|
| A | 200 | Alta frecuencia, neutras | 5 mundos |
| B | 50 | Contexto chileno | Misiones 1-4 |
| C | 50 | Mundo Lectoguarida | Misiones 5-6 |

---

## 2. Distribución por Dificultad

| Dificultad | Cantidad | % | Imageable |
|-----------|----------|---|-----------|
| 1 | ~80 | 27% | Sí |
| 2 | ~100 | 33% | Sí |
| 3 | ~102 | 34% | Sí |
| 4 | ~12 | 4% | Parcial |
| 5 | ~6 | 2% | Parcial |

---

## 3. Distribución por Estructura Silábica

| Tipo | Cantidad | Ejemplo |
|------|----------|---------|
| CV (directa) | ~120 | `ma`, `pe`, `si` |
| VC (inversa) | ~60 | `al`, `en`, `os` |
| CVC (mixta) | ~80 | `pan`, `sol`, `mar` |
| CVV/CVVC (diptongo) | ~30 | `playa`, `país` |
| Otras | ~10 | `psst`, `rr` |

---

## 4. Categorías Semánticas

| Categoría | Cantidad | Ejemplos |
|-----------|----------|----------|
| familia | 30 | mamá, papá, hermano |
| cuerpo | 25 | mano, ojo, boca |
| animales | 25 | gato, perro, pájaro |
| comida | 20 | pan, leche, agua |
| naturaleza | 25 | sol, luna, estrella |
| hogar | 20 | casa, mesa, silla |
| ropa | 15 | zapato, vestido |
| acciones | 40 | correr, saltar, leer |
| adjetivos | 30 | grande, pequeño, bonito |
| Mundo Lectoguarida | 50 | (nombres propios del juego) |
| Chile | 50 | (vocabulario chileno) |
| Otros | - | (diversos) |

---

## 5. Campos por Palabra

Cada entrada incluye:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único (`pal_NNN_word`) |
| `word` | string | Palabra con acentos |
| `normalized` | string | Sin acentos, minúsculas |
| `syllables` | string[] | Segmentación silábica |
| `syllableCount` | number | Debe = `syllables.length` |
| `phonemes` | string[] | Lista de fonemas |
| `difficulty` | number | 1-5 |
| `frequencyRank` | number | 1-300 |
| `frequencyBand` | string | `high`, `medium`, `low` |
| `worlds` | string[] | Mundos donde aparece |
| `semanticCategories` | string[] | Categorías semánticas |
| `phonologicalFeatures` | object | Rasgos fonológicos |
| `orthographicFeatures` | object | Rasgos ortográficos |
| `difficultyScores` | object | Scores por sub-habilidad |
| `status` | string | `pending_review` |

---

## 6. Generación

El banco fue generado con `scripts/generate-word-bank.mjs`:

```bash
node scripts/generate-word-bank.mjs
```

### Reglas de Generación

1. Palabras de alta frecuencia en español chileno
2. Mínimo 80% imageable (difficulty ≤ 3)
3. Sin duplicados (IDs y normalized)
4. Coherencia silábica (syllableCount = syllables.length)
5. Distribución balanceada por banda
6. Todas las nuevas palabras en `pending_review`
