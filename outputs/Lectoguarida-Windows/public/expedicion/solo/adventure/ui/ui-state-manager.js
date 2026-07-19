/**
 * ui-state-manager.js
 * Estado central de la UI de la aventura: región activa, etiquetas accesibles, panel abierto.
 */

export function createUIStateManager() {
  var state = {
    activeRegion: null,
    labelsOn: false,
    openPanel: null,        // null | 'world' | 'backpack' | 'character' | 'pause' | 'reward'
    selectedCharacterId: null
  };
  var listeners = [];

  function emit(evt) {
    for (var i = 0; i < listeners.length; i++) listeners[i](evt, state);
  }

  return {
    get: function () { return state; },
    setActiveRegion: function (id) { state.activeRegion = id; emit({ type: 'region', id: id }); },
    toggleLabels: function () { state.labelsOn = !state.labelsOn; emit({ type: 'labels', on: state.labelsOn }); return state.labelsOn; },
    setLabels: function (on) { state.labelsOn = !!on; emit({ type: 'labels', on: state.labelsOn }); },
    openPanel: function (name) { state.openPanel = name; emit({ type: 'panel', name: name }); },
    closePanel: function () { state.openPanel = null; emit({ type: 'panel', name: null }); },
    setSelectedCharacter: function (id) { state.selectedCharacterId = id; },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (l) { return l !== fn; }); }; },
    emit: emit
  };
}
