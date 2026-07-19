/**
 * event-bus.js
 * Event system for decoupled communication between engine components.
 */

export function createEventBus() {
  var listeners = {};
  var onceListeners = {};

  function on(eventName, handler, scopeId) {
    if (!listeners[eventName]) listeners[eventName] = [];
    listeners[eventName].push({ handler: handler, scopeId: scopeId || null });
  }

  function once(eventName, handler, scopeId) {
    if (!onceListeners[eventName]) onceListeners[eventName] = [];
    onceListeners[eventName].push({ handler: handler, scopeId: scopeId || null });
  }

  function off(eventName, handler) {
    if (listeners[eventName]) {
      listeners[eventName] = listeners[eventName].filter(function (l) { return l.handler !== handler; });
    }
    if (onceListeners[eventName]) {
      onceListeners[eventName] = onceListeners[eventName].filter(function (l) { return l.handler !== handler; });
    }
  }

  function emit(eventName, payload) {
    var result = { defaultPrevented: false, preventDefault: function () { result.defaultPrevented = true; } };
    var regular = listeners[eventName] ? listeners[eventName].slice() : [];
    var oncers = onceListeners[eventName] ? onceListeners[eventName].slice() : [];
    onceListeners[eventName] = [];

    for (var i = 0; i < regular.length; i++) {
      try { regular[i].handler(payload, result); } catch (e) { /* swallow */ }
      if (result.defaultPrevented) break;
    }
    if (!result.defaultPrevented) {
      for (var j = 0; j < oncers.length; j++) {
        try { oncers[j].handler(payload, result); } catch (e) { /* swallow */ }
        if (result.defaultPrevented) break;
      }
    }
    return result;
  }

  function clearScope(scopeId) {
    for (var key in listeners) {
      listeners[key] = listeners[key].filter(function (l) { return l.scopeId !== scopeId; });
    }
    for (var key2 in onceListeners) {
      onceListeners[key2] = onceListeners[key2].filter(function (l) { return l.scopeId !== scopeId; });
    }
  }

  function clear() {
    listeners = {};
    onceListeners = {};
  }

  function listenerCount(eventName) {
    var count = 0;
    if (listeners[eventName]) count += listeners[eventName].length;
    if (onceListeners[eventName]) count += onceListeners[eventName].length;
    return count;
  }

  return {
    on: on,
    once: once,
    off: off,
    emit: emit,
    clearScope: clearScope,
    clear: clear,
    listenerCount: listenerCount
  };
}
