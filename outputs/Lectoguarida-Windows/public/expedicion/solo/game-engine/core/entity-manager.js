/**
 * entity-manager.js
 * Entity Component System core — manages entities and their components.
 */

var nextEntityId = 1;

export function createEntityManager(eventBus) {
  var entities = {};
  var componentIndex = {};

  function createEntity(opts) {
    opts = opts || {};
    var id = opts.id || ('entity-' + (nextEntityId++));
    if (entities[id]) return entities[id];
    var entity = {
      id: id,
      name: opts.name || '',
      tags: opts.tags || [],
      active: opts.active !== false,
      parentId: opts.parentId || null,
      childIds: [],
      componentIds: [],
      sceneId: opts.sceneId || null,
      prefabId: opts.prefabId || null
    };
    entities[id] = entity;
    if (eventBus) eventBus.emit('entity:created', { entityId: id });
    return entity;
  }

  function destroyEntity(id) {
    var entity = entities[id];
    if (!entity) return;
    for (var i = entity.componentIds.length - 1; i >= 0; i--) {
      removeComponent(id, entity.componentIds[i]);
    }
    if (entity.parentId && entities[entity.parentId]) {
      var parent = entities[entity.parentId];
      var idx = parent.childIds.indexOf(id);
      if (idx >= 0) parent.childIds.splice(idx, 1);
    }
    for (var j = 0; j < entity.childIds.length; j++) {
      destroyEntity(entity.childIds[j]);
    }
    delete entities[id];
    if (eventBus) eventBus.emit('entity:destroyed', { entityId: id });
  }

  function getEntity(id) { return entities[id] || null; }

  function setActive(id, active) {
    var entity = entities[id];
    if (entity) entity.active = active;
  }

  function addComponent(entityId, component) {
    var entity = entities[entityId];
    if (!entity || !component || !component.componentId) return;
    entity.componentIds.push(component.componentId);
    if (!componentIndex[component.componentId]) componentIndex[component.componentId] = [];
    componentIndex[component.componentId].push(entityId);
  }

  function removeComponent(entityId, componentId) {
    var entity = entities[entityId];
    if (!entity) return;
    var idx = entity.componentIds.indexOf(componentId);
    if (idx >= 0) entity.componentIds.splice(idx, 1);
    if (componentIndex[componentId]) {
      var idx2 = componentIndex[componentId].indexOf(entityId);
      if (idx2 >= 0) componentIndex[componentId].splice(idx2, 1);
    }
  }

  function getComponent(entityId, componentId) {
    var entity = entities[entityId];
    if (!entity) return null;
    if (entity.componentIds.indexOf(componentId) < 0) return null;
    return { entityId: entityId, componentId: componentId };
  }

  function hasComponent(entityId, componentId) {
    var entity = entities[entityId];
    return entity ? entity.componentIds.indexOf(componentId) >= 0 : false;
  }

  function findByTag(tag) {
    var result = [];
    for (var id in entities) {
      if (entities[id].tags.indexOf(tag) >= 0) result.push(entities[id]);
    }
    return result;
  }

  function findByName(name) {
    var result = [];
    for (var id in entities) {
      if (entities[id].name === name) result.push(entities[id]);
    }
    return result;
  }

  function queryComponents(componentId) {
    return componentIndex[componentId] ? componentIndex[componentId].slice() : [];
  }

  function getAllEntities() {
    var result = [];
    for (var id in entities) result.push(entities[id]);
    return result;
  }

  function clear() {
    entities = {};
    componentIndex = {};
    nextEntityId = 1;
  }

  return {
    createEntity: createEntity,
    destroyEntity: destroyEntity,
    getEntity: getEntity,
    setActive: setActive,
    addComponent: addComponent,
    removeComponent: removeComponent,
    getComponent: getComponent,
    hasComponent: hasComponent,
    findByTag: findByTag,
    findByName: findByName,
    queryComponents: queryComponents,
    getAllEntities: getAllEntities,
    clear: clear,
    get count() { var c = 0; for (var id in entities) c++; return c; }
  };
}
