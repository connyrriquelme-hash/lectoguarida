/**
 * map-fog-controller.js
 * Representa visualmente La Vaguada sobre el mapa mundial.
 * Cubre regiones bloqueadas con nubes de Neblín (no una capa gris plana).
 * Estados: LOCKED (denso), DISCOVERED (parcial), ACTIVE (completo), COMPLETED (sello).
 */

import { REGION_STATES, NEBLIN } from './adventure-config.js';

export function createMapFogController(options) {
  options = options || {};
  var reducedMotion = false;
  try { reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var fogRatio = 1;

  function cloudMarkup(label, ratio, state) {
    var opacity = (0.55 + ratio * 0.4).toFixed(2);
    var desat = state === REGION_STATES.LOCKED ? 'filter:grayscale(0.7);' : '';
    var swirl = reducedMotion ? '' : 'animation: adv-fog-swirl 6s ease-in-out infinite;';
    return '<div class="adv-fog" style="opacity:' + opacity + ';' + desat + swirl + '" aria-hidden="true">' +
      '<span class="adv-fog-cloud"></span>' +
      '<span class="adv-fog-cloud adv-fog-cloud-2"></span>' +
      '<span class="adv-fog-symbols">' + (state === REGION_STATES.LOCKED ? '??' : '✶') + '</span>' +
      '</div>';
  }

  function renderRegionBadge(region) {
    var state = region.state;
    if (state === REGION_STATES.ACTIVE) {
      return '<div class="adv-region-badge adv-region-active">' + region.name + '<span class="adv-region-tag">ACTIVA</span></div>';
    }
    if (state === REGION_STATES.DISCOVERED) {
      return '<div class="adv-region-badge adv-region-discovered">' + region.name + '<span class="adv-region-tag">DESCUBIERTA</span></div>';
    }
    if (state === REGION_STATES.COMPLETED) {
      return '<div class="adv-region-badge adv-region-completed">📖 ' + region.name + '</div>';
    }
    return '<div class="adv-region-badge adv-region-locked" aria-label="Región bloqueada: ' + region.name + '">' +
      cloudMarkup(region.name, 1, REGION_STATES.LOCKED) +
      '<span class="adv-region-name-hidden">' + region.name + '</span></div>';
  }

  function applyFog(rootEl, neblinState) {
    fogRatio = neblinState === NEBLIN.states.DENSE ? 1 : neblinState === NEBLIN.states.CLEARING ? 0.5 : 0.05;
    if (rootEl) rootEl.style.setProperty('--fog-ratio', fogRatio.toFixed(2));
  }

  return {
    renderRegionBadge: renderRegionBadge,
    cloudMarkup: cloudMarkup,
    applyFog: applyFog,
    getFogRatio: function () { return fogRatio; },
    isReducedMotion: function () { return reducedMotion; }
  };
}
