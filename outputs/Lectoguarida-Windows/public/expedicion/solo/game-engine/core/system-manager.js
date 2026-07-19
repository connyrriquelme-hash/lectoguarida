/**
 * system-manager.js
 * Manages game systems with priority ordering and lifecycle.
 */

export function createSystemManager() {
  var systems = [];
  var initialized = false;

  function addSystem(system, priority) {
    if (!system || !system.componentId) return;
    system._priority = priority !== undefined ? priority : (system._priority || 0);
    system._enabled = true;
    systems.push(system);
    systems.sort(function (a, b) { return (a._priority || 0) - (b._priority || 0); });
  }

  function removeSystem(componentId) {
    systems = systems.filter(function (s) { return s.componentId !== componentId; });
  }

  function initialize(context) {
    if (initialized) return;
    initialized = true;
    for (var i = 0; i < systems.length; i++) {
      if (systems[i].initialize && systems[i]._enabled) {
        try { systems[i].initialize(context); } catch (e) { /* swallow */ }
      }
    }
  }

  function fixedUpdate(context, delta) {
    for (var i = 0; i < systems.length; i++) {
      if (systems[i].fixedUpdate && systems[i]._enabled) {
        try { systems[i].fixedUpdate(context, delta); } catch (e) { /* swallow */ }
      }
    }
  }

  function update(context, delta) {
    for (var i = 0; i < systems.length; i++) {
      if (systems[i].update && systems[i]._enabled) {
        try { systems[i].update(context, delta); } catch (e) { /* swallow */ }
      }
    }
  }

  function lateUpdate(context, delta) {
    for (var i = 0; i < systems.length; i++) {
      if (systems[i].lateUpdate && systems[i]._enabled) {
        try { systems[i].lateUpdate(context, delta); } catch (e) { /* swallow */ }
      }
    }
  }

  function destroy(context) {
    for (var i = systems.length - 1; i >= 0; i--) {
      if (systems[i].destroy && systems[i]._enabled) {
        try { systems[i].destroy(context); } catch (e) { /* swallow */ }
      }
    }
    systems = [];
    initialized = false;
  }

  function getSystem(componentId) {
    for (var i = 0; i < systems.length; i++) {
      if (systems[i].componentId === componentId) return systems[i];
    }
    return null;
  }

  function getSystems() { return systems.slice(); }

  return {
    addSystem: addSystem,
    removeSystem: removeSystem,
    initialize: initialize,
    fixedUpdate: fixedUpdate,
    update: update,
    lateUpdate: lateUpdate,
    destroy: destroy,
    getSystem: getSystem,
    getSystems: getSystems
  };
}
