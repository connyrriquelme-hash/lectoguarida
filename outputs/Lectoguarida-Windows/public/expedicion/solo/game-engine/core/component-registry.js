/**
 * component-registry.js
 * Registry for component types and their storage.
 */

export function createComponentRegistry() {
  var storages = {};

  function registerComponent(componentId) {
    if (!storages[componentId]) {
      storages[componentId] = {};
    }
  }

  function setComponent(entityId, componentId, data) {
    registerComponent(componentId);
    storages[componentId][entityId] = Object.assign({ componentId: componentId, entityId: entityId }, data);
  }

  function getComponent(entityId, componentId) {
    return (storages[componentId] && storages[componentId][entityId]) || null;
  }

  function removeComponent(entityId, componentId) {
    if (storages[componentId]) {
      delete storages[componentId][entityId];
    }
  }

  function hasComponent(entityId, componentId) {
    return storages[componentId] ? entityId in storages[componentId] : false;
  }

  function query(componentId) {
    var result = [];
    var storage = storages[componentId];
    if (!storage) return result;
    for (var entityId in storage) {
      result.push(storage[entityId]);
    }
    return result;
  }

  function queryActive(componentId, entityManager) {
    return query(componentId).filter(function (c) {
      var entity = entityManager.getEntity(c.entityId);
      return entity && entity.active;
    });
  }

  function clear() {
    storages = {};
  }

  return {
    registerComponent: registerComponent,
    setComponent: setComponent,
    getComponent: getComponent,
    removeComponent: removeComponent,
    hasComponent: hasComponent,
    query: query,
    queryActive: queryActive,
    clear: clear
  };
}
