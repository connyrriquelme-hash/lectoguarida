/**
 * resource-manager.js
 * Manages shared resources with reference counting.
 */

export function createResourceManager() {
  var resources = {};
  var refCounts = {};

  function acquire(key, factory) {
    if (!resources[key]) {
      resources[key] = factory ? factory() : null;
      refCounts[key] = 0;
    }
    refCounts[key]++;
    return resources[key];
  }

  function release(key) {
    if (!resources[key]) return;
    refCounts[key]--;
    if (refCounts[key] <= 0) {
      delete resources[key];
      delete refCounts[key];
    }
  }

  function get(key) { return resources[key] || null; }
  function has(key) { return key in resources; }
  function getRefCount(key) { return refCounts[key] || 0; }

  function clearUnused() {
    for (var key in refCounts) {
      if (refCounts[key] <= 0) {
        delete resources[key];
        delete refCounts[key];
      }
    }
  }

  function clear() {
    resources = {};
    refCounts = {};
  }

  return {
    acquire: acquire,
    release: release,
    get: get,
    has: has,
    getRefCount: getRefCount,
    clearUnused: clearUnused,
    clear: clear
  };
}
