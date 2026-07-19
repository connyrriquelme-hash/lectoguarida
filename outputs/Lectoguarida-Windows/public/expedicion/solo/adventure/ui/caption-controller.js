/**
 * caption-controller.js
 * Subtítulos sincronizados con audio. Muestra texto completo durante locución.
 * Soporta nivel 1 (texto completo) y nivel 2 (resaltado por boundary events).
 */

export function createCaptionController(container) {
  var root = null;
  var active = false;
  var currentText = '';
  var currentSpeaker = '';
  var captionMode = 'always';
  var audioPlaying = false;

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'adv-caption-bar';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.setAttribute('aria-label', 'Subtítulos');
    root.style.cssText = 'position:absolute;bottom:140px;left:50%;transform:translateX(-50%);width:min(88vw,560px);background:rgba(0,0,0,0.78);color:#fff;border-radius:12px;padding:10px 16px;font-size:0.95rem;line-height:1.5;text-align:center;z-index:19;pointer-events:none;opacity:0;transition:opacity 0.2s ease;font-family:\'Baloo 2\',system-ui,sans-serif;';

    var speakerEl = document.createElement('div');
    speakerEl.className = 'adv-caption-speaker';
    speakerEl.style.cssText = 'font-weight:700;color:#4fd1c5;font-size:0.85rem;margin-bottom:3px;';

    var textEl = document.createElement('div');
    textEl.className = 'adv-caption-text';
    textEl.style.cssText = 'color:#fff;';

    root.appendChild(speakerEl);
    root.appendChild(textEl);
    container.appendChild(root);
  }

  function show(text, speaker) {
    if (captionMode === 'hidden') return;
    mount();
    currentText = text || '';
    currentSpeaker = speaker || '';
    if (captionMode === 'with-audio' && !audioPlaying) {
      active = false;
      if (root) root.style.opacity = '0';
      return;
    }
    active = true;
    var speakerEl = root.querySelector('.adv-caption-speaker');
    var textEl = root.querySelector('.adv-caption-text');
    if (speakerEl) speakerEl.textContent = currentSpeaker;
    if (textEl) textEl.textContent = currentText;
    root.style.opacity = '1';
  }

  function hide() {
    active = false;
    currentText = '';
    currentSpeaker = '';
    if (root) root.style.opacity = '0';
  }

  function updateText(text) {
    if (!active) return;
    currentText = text || '';
    if (root) {
      var textEl = root.querySelector('.adv-caption-text');
      if (textEl) textEl.textContent = currentText;
    }
  }

  function setCaptionMode(mode) {
    captionMode = mode;
    if (mode === 'hidden') hide();
    if (mode === 'with-audio' && !audioPlaying) hide();
    if (mode === 'always' && currentText) show(currentText, currentSpeaker);
  }

  function setAudioPlaying(playing) {
    audioPlaying = playing;
    if (captionMode === 'with-audio') {
      if (playing && currentText) {
        show(currentText, currentSpeaker);
      } else if (!playing) {
        hide();
      }
    }
  }

  function getCaptionMode() { return captionMode; }
  function isActive() { return active; }
  function getCurrentText() { return currentText; }

  function destroy() {
    active = false;
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
  }

  return {
    mount: mount,
    show: show,
    hide: hide,
    updateText: updateText,
    setCaptionMode: setCaptionMode,
    setAudioPlaying: setAudioPlaying,
    getCaptionMode: getCaptionMode,
    isActive: isActive,
    getCurrentText: getCurrentText,
    destroy: destroy
  };
}
