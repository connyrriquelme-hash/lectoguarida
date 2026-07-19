/**
 * pause-menu.js
 * Menú de pausa: continuar, etiquetas accesibles, reiniciar zona (sin borrar progreso global).
 */

export function createPauseMenu(opts) {
  opts = opts || {};
  var onResume = opts.onResume || function () {};
  var onToggleLabels = opts.onToggleLabels || function () {};
  var onRestartZone = opts.onRestartZone || function () {};
  var labelsOn = opts.labelsOn || false;
  var panel = document.createElement('div');
  panel.className = 'adv-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Pausa');

  function render() {
    panel.innerHTML = '<h2>Pausa</h2>' +
      '<button type="button" class="adv-resume" style="display:block;margin:8px 0">Continuar</button>' +
      '<button type="button" class="adv-labels" style="display:block;margin:8px 0">' +
        (labelsOn ? 'Ocultar etiquetas' : 'Mostrar etiquetas') + '</button>' +
      '<button type="button" class="adv-restart" style="display:block;margin:8px 0">Reiniciar zona</button>';
    panel.querySelector('.adv-resume').addEventListener('click', onResume);
    panel.querySelector('.adv-labels').addEventListener('click', function () { labelsOn = !labelsOn; onToggleLabels(labelsOn); render(); });
    panel.querySelector('.adv-restart').addEventListener('click', onRestartZone);
  }
  render();

  return {
    el: panel,
    setLabelsOn: function (v) { labelsOn = v; render(); },
    destroy: function () { if (panel.parentNode) panel.parentNode.removeChild(panel); }
  };
}
