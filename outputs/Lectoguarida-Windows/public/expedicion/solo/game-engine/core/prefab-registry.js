/**
 * prefab-registry.js
 * Registry for entity prefabs — templates for creating entities.
 */

export function createPrefabRegistry() {
  var prefabs = {};

  function registerPrefab(id, config) {
    if (!id || !config) return;
    prefabs[id] = JSON.parse(JSON.stringify(config));
    prefabs[id].id = id;
  }

  function getPrefab(id) {
    return prefabs[id] ? JSON.parse(JSON.stringify(prefabs[id])) : null;
  }

  function instantiate(id, overrides) {
    var prefab = getPrefab(id);
    if (!prefab) return null;
    if (overrides) {
      for (var key in overrides) {
        if (key === 'transform' && prefab.components && prefab.components.transform) {
          for (var tk in overrides.transform) {
            prefab.components.transform[tk] = overrides.transform[tk];
          }
        } else if (prefab.components && prefab.components[key]) {
          // Override component properties
          for (var pk in overrides[key]) {
            prefab.components[key][pk] = overrides[key][pk];
          }
        } else {
          prefab[key] = overrides[key];
        }
      }
    }
    return prefab;
  }

  function createVariant(baseId, variantId, extraConfig) {
    var base = getPrefab(baseId);
    if (!base) return null;
    var variant = Object.assign({}, base, extraConfig || {});
    variant.id = variantId;
    prefabs[variantId] = variant;
    return variant;
  }

  function validatePrefab(config) {
    if (!config) return { valid: false, errors: ['null config'] };
    var errors = [];
    if (!config.id) errors.push('missing id');
    if (config.components && !Array.isArray(config.components)) errors.push('components must be array');
    return { valid: errors.length === 0, errors: errors };
  }

  function getRegisteredPrefabs() {
    var result = [];
    for (var id in prefabs) result.push(prefabs[id]);
    return result;
  }

  return {
    registerPrefab: registerPrefab,
    getPrefab: getPrefab,
    instantiate: instantiate,
    createVariant: createVariant,
    validatePrefab: validatePrefab,
    getRegisteredPrefabs: getRegisteredPrefabs
  };
}
