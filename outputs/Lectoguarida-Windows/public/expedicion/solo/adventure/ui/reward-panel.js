/**
 * reward-panel.js
 * Muestra una recompensa obtenida (ej. Broche de Rina). No repetible, cosmética.
 */

export function createRewardPanel(opts) {
  opts = opts || {};
  var reward = opts.reward || null;
  var onClose = opts.onClose || function () {};
  var panel = document.createElement('div');
  panel.className = 'adv-panel adv-reward-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Recompensa');

  function render() {
    if (!reward) { panel.innerHTML = '<button type="button" class="adv-close">Cerrar</button>'; return; }
    panel.innerHTML = '<h2>¡Recompensa!</h2>' +
      '<div style="font-size:3rem">' + (reward.icon || '🏅') + '</div>' +
      '<p><strong>' + (reward.name || reward.id) + '</strong></p>' +
      '<p>' + (reward.description || '') + '</p>' +
      '<button type="button" class="adv-close">Cerrar</button>';
    var close = panel.querySelector('.adv-close');
    if (close) close.addEventListener('click', onClose);
  }
  render();

  return {
    el: panel,
    setReward: function (r) { reward = r; render(); },
    destroy: function () { if (panel.parentNode) panel.parentNode.removeChild(panel); }
  };
}
