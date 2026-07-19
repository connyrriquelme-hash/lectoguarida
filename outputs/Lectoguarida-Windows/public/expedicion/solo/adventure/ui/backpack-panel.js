/**
 * backpack-panel.js
 * Mochila del jugador: hasta 6 slots desde BACKPACK_SLOTS. Muestra ítems desbloqueados.
 */

export function createBackpackPanel(opts) {
  opts = opts || {};
  var items = opts.items || [];
  var maxSlots = opts.maxSlots || 6;
  var onClose = opts.onClose || function () {};
  var panel = document.createElement('div');
  panel.className = 'adv-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Mochila del explorador');

  function render() {
    var slots = '';
    for (var i = 0; i < maxSlots; i++) {
      var it = items[i];
      if (it) slots += '<div class="adv-backpack-slot filled" title="' + (it.name || it.id) + '">' + (it.icon || '★') + '</div>';
      else slots += '<div class="adv-backpack-slot"></div>';
    }
    panel.innerHTML = '<h2>Mochila del explorador</h2><div class="adv-backpack">' + slots + '</div>' +
      '<button type="button" class="adv-close" style="margin-top:18px">Cerrar</button>';
    var close = panel.querySelector('.adv-close');
    if (close) close.addEventListener('click', onClose);
  }
  render();

  return {
    el: panel,
    update: function (newItems, newMax) { items = newItems || items; if (newMax) maxSlots = newMax; render(); },
    destroy: function () { if (panel.parentNode) panel.parentNode.removeChild(panel); }
  };
}
