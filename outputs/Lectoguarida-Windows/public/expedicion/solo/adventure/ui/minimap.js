/**
 * minimap.js
 * Minimapa 2D (SVG) de las 6 regiones del archipiélago. No muestra nombres de regiones no descubiertas.
 * Permite expandir/contraer y pulsar para abrir el mapa mundial.
 */

export function createMinimap(opts) {
  opts = opts || {};
  var regions = opts.regions || [];
  var onOpenMap = opts.onOpenMap || function () {};
  var wrap = document.createElement('div');
  wrap.className = 'adv-minimap minimized';
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('tabindex', '0');
  wrap.setAttribute('aria-label', 'Minimapa. Pulsa para abrir el mapa del archipiélago.');

  function render() {
    var known = regions.filter(function (r) { return r.state !== 'LOCKED' || r.discovered; });
    var dots = known.map(function (r, i) {
      var x = 30 + (i % 3) * 40;
      var y = 30 + Math.floor(i / 3) * 40;
      var color = r.state === 'ACTIVE' ? '#4fd1c5' : (r.state === 'DISCOVERED' ? '#9ad0f0' : '#bcc');
      return '<circle cx="' + x + '" cy="' + y + '" r="12" fill="' + color + '" stroke="#8d6e63" stroke-width="2"/>';
    }).join('');
    wrap.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true">' + dots + '</svg>';
  }

  render();

  function toggle() { wrap.classList.toggle('minimized'); }
  wrap.addEventListener('click', function () {
    if (wrap.classList.contains('minimized')) toggle(); else onOpenMap();
  });
  wrap.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (wrap.classList.contains('minimized')) toggle(); else onOpenMap(); }
  });

  return {
    el: wrap,
    expand: function () { wrap.classList.remove('minimized'); },
    update: function (newRegions) { regions = newRegions || regions; render(); },
    destroy: function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
  };
}
