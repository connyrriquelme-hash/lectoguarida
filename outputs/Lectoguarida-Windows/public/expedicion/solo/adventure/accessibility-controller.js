/**
 * accessibility-controller.js
 * Sincroniza el estado del mundo 3D con controles HTML accesibles,
 * respeta reduced-motion y mantiene foco/aria.
 */

export function createAccessibilityController(options) {
  options = options || {};
  var reducedMotion = false;
  var labelsOn = false;
  try {
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* noop */ }

  function announce(liveRegion, text) {
    if (liveRegion) liveRegion.textContent = text;
  }

  function applyReducedMotion(root) {
    if (!reducedMotion || !root) return;
    root.classList.add('adv-reduced-motion');
  }

  function ensureFocusable(el, label) {
    if (!el) return;
    if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
  }

  return {
    isReducedMotion: function () { return reducedMotion; },
    announce: announce,
    applyReducedMotion: applyReducedMotion,
    ensureFocusable: ensureFocusable,
    setReducedMotion: function (v) { reducedMotion = v; },
    setLabels: function (on) { labelsOn = !!on; },
    getLabels: function () { return labelsOn; }
  };
}
