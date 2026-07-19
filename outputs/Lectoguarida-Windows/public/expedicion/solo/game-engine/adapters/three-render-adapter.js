/**
 * three-render-adapter.js
 * Connects V2 RenderComponent.object3D to THREE.Scene.
 * Syncs TransformComponent -> object3D position/rotation/scale.
 * Adds/removes on entity create/destroy.
 */

export function createThreeRenderAdapter(options) {
  options = options || {};
  var context = options.context;
  var scene = options.scene;
  var renderer = options.renderer;
  var camera = options.camera;
  var started = false;
  var entityObjectMap = new Map();
  var destroyed = false;

  function start() {
    started = true;
    syncAll();
  }

  function syncAll() {
    if (!context || !context.entityManager) return;
    var em = context.entityManager;
    var entities = em.getAllEntities ? em.getAllEntities() : [];
    entities.forEach(function (entity) {
      if (entity && entity.id) ensureObject3D(entity);
    });
  }

  function ensureObject3D(entity) {
    if (entityObjectMap.has(entity.id)) return;
    var renderComp = context.componentRegistry.getComponent(entity.id, 'render');
    if (!renderComp || !renderComp.object3D) return;

    var obj = renderComp.object3D;
    if (scene && obj.parent !== scene) {
      scene.add(obj);
    }
    entityObjectMap.set(entity.id, obj);
    syncTransform(entity);
  }

  function syncTransform(entity) {
    var obj = entityObjectMap.get(entity.id);
    if (!obj) return;
    var transformComp = context.componentRegistry.getComponent(entity.id, 'transform');
    if (!transformComp) return;

    if (transformComp.position) {
      obj.position.set(transformComp.position[0] || 0, transformComp.position[1] || 0, transformComp.position[2] || 0);
    }
    if (transformComp.rotation) {
      obj.rotation.set(transformComp.rotation[0] || 0, transformComp.rotation[1] || 0, transformComp.rotation[2] || 0);
    }
    if (transformComp.scale) {
      obj.scale.set(transformComp.scale[0] || 1, transformComp.scale[1] || 1, transformComp.scale[2] || 1);
    }
    obj.visible = transformComp.active !== false && renderCompVisible(entity);
  }

  function renderCompVisible(entity) {
    var renderComp = context.componentRegistry.getComponent(entity.id, 'render');
    return renderComp ? renderComp.visible !== false : true;
  }

  function onEntityCreated(entity) {
    if (destroyed) return;
    ensureObject3D(entity);
  }

  function onEntityDestroyed(entityId) {
    if (destroyed) return;
    var obj = entityObjectMap.get(entityId);
    if (obj && obj.parent) obj.parent.remove(obj);
    entityObjectMap.delete(entityId);
  }

  function onComponentAdded(entityId, componentId) {
    if (destroyed) return;
    if (componentId === 'render') {
      var entity = context.entityManager.getEntity(entityId);
      if (entity) ensureObject3D(entity);
    }
  }

  function onComponentRemoved(entityId, componentId) {
    if (destroyed) return;
    if (componentId === 'render') {
      var obj = entityObjectMap.get(entityId);
      if (obj && obj.parent) obj.parent.remove(obj);
      entityObjectMap.delete(entityId);
    }
  }

  function update() {
    if (!started || destroyed) return;
    entityObjectMap.forEach(function (obj, entityId) {
      var entity = context.entityManager.getEntity(entityId);
      if (entity) syncTransform(entity);
    });
  }

  function destroy() {
    destroyed = true;
    entityObjectMap.forEach(function (obj) {
      if (obj && obj.parent) obj.parent.remove(obj);
    });
    entityObjectMap.clear();
  }

  if (context && context.eventBus) {
    context.eventBus.on('entity:created', onEntityCreated);
    context.eventBus.on('entity:destroyed', onEntityDestroyed);
    context.eventBus.on('component:added', onComponentAdded);
    context.eventBus.on('component:removed', onComponentRemoved);
  }

  return {
    start: start,
    update: update,
    destroy: destroy,
    getObject3D: function (entityId) { return entityObjectMap.get(entityId); }
  };
}