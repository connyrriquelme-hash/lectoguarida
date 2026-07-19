/**
 * sound-cue-overlay.js
 * Indicadores visuales de sonidos relevantes.
 * Muestra eventos como campana cercana, personaje hablando, éxito, etc.
 */

var CUE_TYPES = {
  INSTRUCTION: 'instruction',
  DIRECTIONAL: 'directional',
  SUCCESS: 'success',
  WARNING: 'warning',
  AMBIENT: 'ambient'
};

var SOUND_CUES = {
  bell_nearby: { type: CUE_TYPES.DIRECTIONAL, text: '\uD83D\uDD14 Suena una campana cerca.', icon: '\uD83D\uDD14' },
  bell_found: { type: CUE_TYPES.SUCCESS, text: '\u2728 Encontraste una campana.', icon: '\u2728' },
  rina_speaking: { type: CUE_TYPES.INSTRUCTION, text: 'Rina est\u00e1 hablando.', icon: '\uD83D\uDC38' },
  lumiercoles_guide: { type: CUE_TYPES.DIRECTIONAL, text: 'Lumi\u00e9rcoles se\u00f1ala el camino.', icon: '\uD83E\uDD8B' },
  word_correct: { type: CUE_TYPES.SUCCESS, text: '\u2714\uFE0F \u00a1Encontraste la palabra que rima!', icon: '\u2714\uFE0F' },
  word_wrong: { type: CUE_TYPES.WARNING, text: '\uD83D\uDD0D Observa las palabras e intenta otra vez.', icon: '\uD83D\uDD0D' },
  vaguada_wind: { type: CUE_TYPES.AMBIENT, text: 'El viento mueve la niebla.', icon: '\uD83C\uDF2C\uFE0F' },
  mission_start: { type: CUE_TYPES.INSTRUCTION, text: 'Una nueva misi\u00f3n comienza.', icon: '\uD83D\uDCCB' },
  mission_complete: { type: CUE_TYPES.SUCCESS, text: '\uD83C\uDFC6 \u00a1Misi\u00f3n completada!', icon: '\uD83C\uDFC6' },
  hint_available: { type: CUE_TYPES.INSTRUCTION, text: 'Puedes pedir una pista.', icon: '\u2753' }
};

export function createSoundCueOverlay(container) {
  var root = null;
  var cueQueue = [];
  var showAmbient = false;
  var cueTimer = null;
  var onCueClick = null;

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'adv-sound-cue-overlay';
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-label', 'Indicadores de sonido');
    root.style.cssText = 'position:absolute;top:80px;left:50%;transform:translateX(-50%);z-index:20;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:6px;';

    container.appendChild(root);
  }

  function showCue(cueId, directionAngle) {
    var cue = SOUND_CUES[cueId];
    if (!cue) return;
    if (cue.type === CUE_TYPES.AMBIENT && !showAmbient) return;

    mount();

    var el = document.createElement('div');
    el.className = 'adv-sound-cue';
    el.setAttribute('role', 'status');
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:12px;font-size:0.88rem;font-weight:600;color:#fff;pointer-events:auto;cursor:pointer;animation:advCueFadeIn 0.3s ease;box-shadow:0 3px 10px rgba(0,0,0,0.25);';

    var bgColors = {
      instruction: 'rgba(79,209,197,0.92)',
      directional: 'rgba(255,179,107,0.92)',
      success: 'rgba(77,171,102,0.92)',
      warning: 'rgba(255,140,105,0.92)',
      ambient: 'rgba(120,140,160,0.85)'
    };
    el.style.background = bgColors[cue.type] || bgColors.instruction;

    var iconSpan = document.createElement('span');
    iconSpan.textContent = cue.icon;
    iconSpan.style.cssText = 'font-size:1.1rem;';

    var textSpan = document.createElement('span');
    textSpan.textContent = cue.text;

    el.appendChild(iconSpan);
    el.appendChild(textSpan);

    if (directionAngle !== undefined && directionAngle !== null) {
      var arrow = document.createElement('span');
      arrow.className = 'adv-sound-cue-arrow';
      arrow.style.cssText = 'font-size:1rem;transform:rotate(' + (directionAngle * 180 / Math.PI) + 'deg);';
      arrow.textContent = '\u2192';
      el.appendChild(arrow);
    }

    el.addEventListener('click', function () {
      if (onCueClick) onCueClick(cueId, cue);
      el.remove();
    });

    root.appendChild(el);

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function () { if (el.parentNode) el.remove(); }, 300);
    }, 4000);
  }

  function setShowAmbient(v) { showAmbient = v; }
  function getShowAmbient() { return showAmbient; }

  function destroy() {
    if (cueTimer) { clearTimeout(cueTimer); cueTimer = null; }
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    cueQueue = [];
  }

  return {
    mount: mount,
    showCue: showCue,
    setShowAmbient: setShowAmbient,
    getShowAmbient: getShowAmbient,
    setOnCueClick: function (fn) { onCueClick = fn; },
    destroy: destroy
  };
}

export { CUE_TYPES, SOUND_CUES };
