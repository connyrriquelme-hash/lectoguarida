/**
 * world-map.js
 * Mapa mundial interactivo 2D (fallback y panel). Muestra 6 regiones con niebla (Neblín) si no descubiertas.
 * No revela nombres de regiones bloqueadas; el click en activa/disponible dispara selección.
 */

export function createWorldMap(opts) {
  opts = opts || {};
  var regions = opts.regions || [];
  var onSelect = opts.onSelect || function () {};
  var onClose = opts.onClose || function () {};
  var panel = document.createElement('div');
  panel.className = 'adv-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Mapa del Archipiélago de las Palabras');

  function visibleName(r) {
    if (r.state === 'LOCKED' && !r.discovered) return '?????';
    return r.name;
  }

  function render() {
    var cards = regions.map(function (r) {
      var cls = 'adv-region ' + r.state.toLowerCase();
      var fog = '';
      if (r.state === 'LOCKED' && !r.discovered) {
        fog = '<div class="adv-fog"><span class="adv-fog-cloud"></span><span class="adv-fog-cloud adv-fog-cloud-2"></span><span class="adv-fog-symbols">? ? ?</span></div>';
      }
      var tag = r.state === 'ACTIVE' ? '<span class="adv-region-tag">activa</span>'
        : r.state === 'DISCOVERED' ? '<span class="adv-region-tag">visitada</span>' : '';
      return '<div class="' + cls + '" data-id="' + r.id + '" role="button" tabindex="0">' +
        '<div class="adv-region-name-hidden">' + visibleName(r) + '</div>' + tag + fog + '</div>';
    }).join('');
    panel.innerHTML = '<h2>El Archipiélago de las Palabras</h2>' +
      '<div class="adv-world-map">' + cards + '</div>' +
      '<button type="button" class="adv-close" style="margin-top:18px">Cerrar</button>';
    var close = panel.querySelector('.adv-close');
    if (close) close.addEventListener('click', onClose);
    var cardsEl = panel.querySelectorAll('.adv-region');
    cardsEl.forEach(function (c) {
      var id = c.getAttribute('data-id');
      var r = regions.find(function (x) { return x.id === id; });
      function act() { if (r.state === 'ACTIVE' || r.state === 'DISCOVERED') onSelect(id); }
      c.addEventListener('click', act);
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
  }

  render();

  return {
    el: panel,
    update: function (newRegions) { regions = newRegions || regions; render(); },
    destroy: function () { if (panel.parentNode) panel.parentNode.removeChild(panel); }
  };
}
