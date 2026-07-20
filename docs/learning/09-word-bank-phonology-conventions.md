# Convenciones de Fonología del Banco de Palabras

## Documento: 09-word-bank-phonology-conventions.md

### Propósito

Documentar las convenciones de representación fonológica usadas en `word-bank-foundation.json`.

---

## 1. Representación de Sonidos Iniciales

| Grafema | Fonema (initialSound) | Notas |
|---------|----------------------|-------|
| c (e/i) | `"s"` | Antes de e, i → /s/ |
| c (a/o/u) | `"k"` | Antes de a, o, u → /k/ |
| g (e/i) | `"x"` | Antes de e, i → /x/ (jota) |
| g (a/o/u) | `"g"` | Antes de a, o, u → /g/ |
| h | `"-"` | Siempre muda en español |
| b | `"b"` | Merged con v |
| v | `"b"` | Merged con b |
| ll | `"y"` | Yeísmo (chileno estándar) |
| rr | `"rr"` | Vibrante múltiple |
| qu | `"k"` | q siempre seguida de u |
| güe/güi | `"g"` | U semisilenciosa preservada |

---

## 2. Convenciones de Sílabas

### Estructura Silábica

| Tipo | Ejemplo | Estructura |
|------|---------|-----------|
| Directa | `ma` | CV |
| Inversa | `al` | VC |
| Mixta | `bra` | CVC |
| Con hiato | `país` | CV.VC |
| Con diptongo | `playa` | CVC.VV |

### Conteo de Sílabas

- `syllableCount` debe ser igual a `syllables.length`
- El validator verifica esta coherencia

---

## 3. Fonemas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `phonemes` | `string[]` | Lista de fonemas (IPA simplificado) |
| `phonemeCount` | `number` | Cantidad de fonemas |
| `phonologicalFeatures.hasDigraph` | `boolean` | Contiene diptongo (ch, ll, rr) |
| `phonologicalFeatures.hasConsonantCluster` | `boolean` | Contiene grupo consonántico |
| `phonologicalFeatures.hasDiphthong` | `boolean` | Contiene diptongo vocalico |
| `phonologicalFeatures.hasHiatus` | `boolean` | Contiene hiato |
| `phonologicalFeatures.rhymeFamily` | `string` | Familia de rima para juegos fonológicos |

---

## 4. Características Ortográficas

| Campo | Descripción |
|-------|-------------|
| `orthographicFeatures.hasAccentMark` | Tiene tilde diacrítica |
| `orthographicFeatures.accentType` | `aguda`, `llana`, o `esdrújula` |
| `orthographicFeatures.hasSilentH` | Contiene h muda |
| `orthographicFeatures.hasBV` | Contiene b/v (merge fonológico) |
| `orthographicFeatures.hasGJ` | Contiene g/j (distinción dialectal) |
| `orthographicFeatures.hasCSZ` | Contiene c/s/z (seseo/ceceo) |
| `orthographicFeatures.hasYLL` | Contiene y/ll (yeísmo) |

---

## 5. Niveles de Dificultad

| Dificultad | Significado | Imageable |
|-----------|-------------|-----------|
| 1 | Muy fácil (CV, alta frecuencia) | Sí |
| 2 | Fácil (sílabas directas) | Sí |
| 3 | Normal (sílabas mixtas) | Sí |
| 4 | Difícil (grupos consonánticos) | Parcial |
| 5 | Muy difícil (diptongos, palabras largas) | Parcial |

### Criterio de Validación

Mínimo 80% del bank debe ser imageable (difficulad ≤ 3). Actual: 94% (282/300).

---

## 6. Bandas de Frecuencia

| Banda | Cantidad | Criterio |
|-------|----------|----------|
| A (alta frecuencia) | 200 | Palabras neutras, alta frecuencia en español |
| B (contexto chileno) | 50 | Vocabulario chileno específico |
| C (mundo Lectoguarida) | 50 | Palabras del mundo ficticio |
