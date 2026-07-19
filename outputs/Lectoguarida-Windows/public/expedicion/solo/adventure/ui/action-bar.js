/**
 * action-bar.js
 * Barra de acciones sin lector: Escuchar, Repetir, Pista, Interactuar, Pausa.
 * Cada botón es un botón accesible con icono SVG y etiqueta visible si labels=on.
 */

var ICONS = {
  escuchar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>',
  repetir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>',
  pista: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm-1 3h2v6H8v-2h3zm4 0v6h2v-4h2v-2z"/></svg>',
  interactuar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 11.2 11 13v6h2v-6l2-1.8V5h-2v3h-2V5H9zM4 3h2v8h2v2H6v2H4z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>'
};

var ACTIONS = [
  { id: 'escuchar', label: 'Escuchar' },
  { id: 'repetir', label: 'Repetir' },
  { id: 'pista', label: 'Pista' },
  { id: 'interactuar', label: 'Interactuar' },
  { id: 'pausa', label: 'Pausa' }
];

export function createActionBar(opts) {
  opts = opts || {};
  var onAction = opts.onAction || function () {};
  var bar = document.createElement('div');
  bar.className = 'adv-action-bar';
  bar.setAttribute('role', 'toolbar');
  bar.setAttribute('aria-label', 'Acciones de la aventura');
  var buttons = {};
  ACTIONS.forEach(function (a) {
    var b = document.createElement('button');
    b.className = 'adv-action-btn';
    b.type = 'button';
    b.setAttribute('aria-label', a.label);
    b.innerHTML = ICONS[a.id] + '<span class="adv-label">' + a.label + '</span>';
    b.addEventListener('click', function () { onAction(a.id); });
    bar.appendChild(b);
    buttons[a.id] = b;
  });
  return {
    el: bar,
    setLabels: function (on) { bar.classList.toggle('adv-labels-on', !!on); bar.classList.toggle('adv-labels-off', !on); },
    destroy: function () { if (bar.parentNode) bar.parentNode.removeChild(bar); }
  };
}
