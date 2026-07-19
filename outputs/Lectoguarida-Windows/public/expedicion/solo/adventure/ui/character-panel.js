/**
 * character-panel.js
 * Selección de los 4 avatares refinados con su motivo territorial.
 */

export function createCharacterPanel(opts) {
  opts = opts || {};
  var characters = opts.characters || [];
  var selectedId = opts.selectedId || (characters[0] && characters[0].id);
  var onSelect = opts.onSelect || function () {};
  var onClose = opts.onClose || function () {};
  var panel = document.createElement('div');
  panel.className = 'adv-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Elegir explorador');

  function render() {
    var cards = characters.map(function (c) {
      var sel = c.id === selectedId ? 'border:3px solid #4fd1c5;' : '';
      return '<div class="adv-character-card" data-id="' + c.id + '" role="button" tabindex="0" style="' + sel + 'padding:12px;margin:8px;border-radius:12px;background:#eef6f2;cursor:pointer">' +
        '<div><strong>' + c.name + '</strong></div>' +
        '<div class="motif">Motivo: ' + (c.motif || '—') + '</div>' +
        (c.tagline ? '<div class="motif">' + c.tagline + '</div>' : '') + '</div>';
    }).join('');
    panel.innerHTML = '<h2>Elige tu explorador</h2>' + cards + '<button type="button" class="adv-close" style="margin-top:18px">Cerrar</button>';
    var close = panel.querySelector('.adv-close');
    if (close) close.addEventListener('click', onClose);
    panel.querySelectorAll('.adv-character-card').forEach(function (el) {
      var id = el.getAttribute('data-id');
      function act() { selectedId = id; onSelect(id); render(); }
      el.addEventListener('click', act);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    });
  }
  render();

  return {
    el: panel,
    destroy: function () { if (panel.parentNode) panel.parentNode.removeChild(panel); }
  };
}
