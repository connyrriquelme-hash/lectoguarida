/**
 * fog-progress-controller.js
 * Controla el estado de La Vaguada y la claridad de Neblín por región.
 * Persistencia compatible con el progreso existente (idempotente).
 */

import { REGION_STATES, NEBLIN } from './adventure-config.js';

export function createFogProgressController(deps) {
  var progress = deps.progress;
  var onChange = deps.onChange || function () {};
  var current = NEBLIN.states.DENSE;

  function load() {
    var adv = progress.loadAdventure();
    if (adv.neblinState && NEBLIN.states[adv.neblinState]) {
      current = NEBLIN.states[adv.neblinState];
    } else {
      current = NEBLIN.states.DENSE;
    }
  }

  function save() {
    var adv = progress.loadAdventure();
    var next = Object.assign({}, adv, { neblinState: current });
    progress.saveAdventure(next);
  }

  function getNeblinState() { return current; }

  function regionState(region) {
    var adv = progress.loadAdventure();
    var override = adv.regions && adv.regions[region.id];
    if (override && override.state) return override.state;
    return region.state;
  }

  function setRegionState(regionId, state) {
    var adv = progress.loadAdventure();
    var regions = Object.assign({}, adv.regions || {});
    regions[regionId] = Object.assign({}, regions[regionId] || {}, { state: state });
    progress.saveAdventure({ regions: regions });
    onChange({ type: 'region', regionId: regionId, state: state });
  }

  function discoverRegion(regionId) {
    setRegionState(regionId, REGION_STATES.DISCOVERED);
  }

  function completeRegion(regionId) {
    setRegionState(regionId, REGION_STATES.COMPLETED);
  }

  function clearFog() {
    if (current === NEBLIN.states.FRIENDLY) return;
    current = (current === NEBLIN.states.DENSE) ? NEBLIN.states.CLEARING : NEBLIN.states.FRIENDLY;
    save();
    onChange({ type: 'neblin', state: current });
  }

  function reset() {
    current = NEBLIN.states.DENSE;
    save();
  }

  function fogRatio() {
    switch (current) {
      case NEBLIN.states.DENSE: return 1;
      case NEBLIN.states.CLEARING: return 0.5;
      case NEBLIN.states.FRIENDLY: return 0.05;
      default: return 1;
    }
  }

  load();

  return {
    getNeblinState: getNeblinState,
    setNeblinState: function (s) { current = s; save(); },
    regionState: regionState,
    setRegionState: setRegionState,
    discoverRegion: discoverRegion,
    completeRegion: completeRegion,
    clearFog: clearFog,
    reset: reset,
    fogRatio: fogRatio
  };
}
