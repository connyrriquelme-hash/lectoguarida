/**
 * resource-disposer.js
 * Utilidad central para liberar geometrías, materiales, texturas y listeners.
 * Previene fugas de memoria al destruir el mundo 3D.
 */

export function disposeObject3D(object) {
  if (!object) return;
  object.traverse(function (node) {
    if (node.geometry) {
      try { node.geometry.dispose(); } catch (e) { /* noop */ }
    }
    if (node.material) {
      var materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(function (material) {
        if (!material) return;
        for (var key in material) {
          var value = material[key];
          if (value && value.isTexture) {
            try { value.dispose(); } catch (e) { /* noop */ }
          }
        }
        try { material.dispose(); } catch (e) { /* noop */ }
      });
    }
  });
}

export function createDisposer() {
  var disposables = [];
  var timers = [];
  var listeners = [];
  var rafIds = [];

  return {
    trackDisposable: function (item) {
      if (item) disposables.push(item);
      return item;
    },
    trackTimer: function (id) {
      timers.push(id);
      return id;
    },
    clearTimer: function (id) {
      var idx = timers.indexOf(id);
      if (idx >= 0) timers.splice(idx, 1);
      try { clearTimeout(id); clearInterval(id); } catch (e) { /* noop */ }
    },
    trackListener: function (target, type, handler, options) {
      listeners.push({ target: target, type: type, handler: handler, options: options });
      target.addEventListener(type, handler, options);
      return handler;
    },
    removeListener: function (target, type, handler, options) {
      for (var i = 0; i < listeners.length; i++) {
        var l = listeners[i];
        if (l.target === target && l.type === type && l.handler === handler) {
          target.removeEventListener(type, handler, options || l.options);
          listeners.splice(i, 1);
          i--;
        }
      }
    },
    trackRaf: function (id) {
      rafIds.push(id);
      return id;
    },
    cancelRaf: function (id) {
      var idx = rafIds.indexOf(id);
      if (idx >= 0) rafIds.splice(idx, 1);
      try { cancelAnimationFrame(id); } catch (e) { /* noop */ }
    },
    disposeAll: function () {
      rafIds.forEach(function (id) { try { cancelAnimationFrame(id); } catch (e) {} });
      rafIds = [];
      timers.forEach(function (id) { try { clearTimeout(id); clearInterval(id); } catch (e) {} });
      timers = [];
      listeners.forEach(function (l) {
        try { l.target.removeEventListener(l.type, l.handler, l.options); } catch (e) {}
      });
      listeners = [];
      disposables.forEach(function (item) {
        try {
          if (typeof item.dispose === 'function') item.dispose();
          else if (item.isObject3D) disposeObject3D(item);
        } catch (e) { /* noop */ }
      });
      disposables = [];
    }
  };
}
