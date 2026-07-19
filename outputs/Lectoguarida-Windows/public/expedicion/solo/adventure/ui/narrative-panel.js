/**
 * narrative-panel.js
 * Panel narrativo persistente en la parte inferior.
 * Muestra retrato, nombre, texto, indicador de progreso y controles.
 */

export function createNarrativePanel(container) {
  var root = null;
  var visible = false;
  var collapsed = false;
  var currentSpeaker = null;
  var currentText = '';
  var lines = [];
  var lineIndex = 0;
  var onAdvance = null;
  var onRepeat = null;
  var onListen = null;

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'adv-narrative-panel';
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Panel narrativo');
    root.style.cssText = 'position:absolute;bottom:70px;left:50%;transform:translateX(-50%);width:min(90vw,600px);max-height:35vh;background:linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,248,225,0.94));border:2px solid rgba(139,119,73,0.35);border-radius:16px;padding:14px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:18;pointer-events:auto;font-family:\'Baloo 2\',system-ui,sans-serif;overflow-y:auto;transition:opacity 0.2s ease;';

    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;';

    var portrait = document.createElement('div');
    portrait.className = 'adv-narrative-portrait';
    portrait.style.cssText = 'width:36px;height:36px;border-radius:50%;background:#4fd1c5;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#fff;flex-shrink:0;';
    portrait.textContent = '\u{1F4AC}';

    var speaker = document.createElement('span');
    speaker.className = 'adv-narrative-speaker';
    speaker.style.cssText = 'font-weight:800;color:#2d6a4f;font-size:0.95rem;';
    speaker.textContent = '';

    var progress = document.createElement('span');
    progress.className = 'adv-narrative-progress';
    progress.style.cssText = 'margin-left:auto;font-size:0.8rem;color:#888;';

    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'adv-narrative-toggle';
    toggleBtn.setAttribute('aria-label', 'Ocultar narrativa');
    toggleBtn.style.cssText = 'margin-left:6px;background:none;border:none;cursor:pointer;font-size:1.1rem;color:#666;padding:2px 6px;border-radius:6px;min-width:32px;min-height:32px;';
    toggleBtn.textContent = '\u2212';

    header.appendChild(portrait);
    header.appendChild(speaker);
    header.appendChild(progress);
    header.appendChild(toggleBtn);

    var body = document.createElement('div');
    body.className = 'adv-narrative-body';
    body.setAttribute('aria-live', 'polite');
    body.style.cssText = 'color:#222;font-size:0.95rem;line-height:1.5;min-height:40px;margin-bottom:8px;';

    var textEl = document.createElement('p');
    textEl.className = 'adv-narrative-text';
    textEl.style.cssText = 'margin:0;';

    var captionEl = document.createElement('div');
    captionEl.className = 'adv-narrative-caption';
    captionEl.style.cssText = 'display:none;margin-top:6px;padding:6px 10px;background:rgba(0,0,0,0.06);border-radius:8px;font-size:0.85rem;color:#444;font-style:italic;border-left:3px solid #4fd1c5;';

    body.appendChild(textEl);
    body.appendChild(captionEl);

    var controls = document.createElement('div');
    controls.className = 'adv-narrative-controls';
    controls.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;';

    function makeCtrlBtn(label, ariaLabel, cls, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'adv-narrative-btn ' + (cls || '');
      b.setAttribute('aria-label', ariaLabel);
      b.textContent = label;
      b.style.cssText = 'min-width:40px;min-height:40px;border-radius:10px;border:none;background:rgba(79,209,197,0.2);color:#2d6a4f;font-size:0.9rem;font-weight:700;cursor:pointer;padding:6px 12px;';
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
      controls.appendChild(b);
      return b;
    }

    makeCtrlBtn('\u25B6', 'Escuchar', 'adv-narrative-listen', function () {
      if (onListen) onListen();
    });
    makeCtrlBtn('\u21BB', 'Repetir', 'adv-narrative-repeat', function () {
      if (onRepeat) onRepeat();
    });
    makeCtrlBtn('\u27A1', 'Continuar', 'adv-narrative-advance', function () {
      advanceLine();
    });

    root.appendChild(header);
    root.appendChild(body);
    root.appendChild(controls);

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : '';
      controls.style.display = collapsed ? 'none' : '';
      toggleBtn.textContent = collapsed ? '+' : '\u2212';
      toggleBtn.setAttribute('aria-label', collapsed ? 'Mostrar narrativa' : 'Ocultar narrativa');
    });

    container.appendChild(root);
  }

  function advanceLine() {
    if (lineIndex < lines.length - 1) {
      lineIndex++;
      showCurrentLine();
    } else {
      hide();
      if (onAdvance) onAdvance();
    }
  }

  function showCurrentLine() {
    if (!root || lineIndex >= lines.length) return;
    var textEl = root.querySelector('.adv-narrative-text');
    var speakerEl = root.querySelector('.adv-narrative-speaker');
    var progressEl = root.querySelector('.adv-narrative-progress');
    var portraitEl = root.querySelector('.adv-narrative-portrait');
    if (textEl) textEl.textContent = lines[lineIndex];
    if (speakerEl) speakerEl.textContent = currentSpeaker || '';
    if (progressEl) progressEl.textContent = (lineIndex + 1) + '/' + lines.length;
    if (portraitEl) {
      var icons = { 'Rina': '\u{1F438}', 'Lumi\u00e9rcoles': '\u{1F98B}', 'Narrador': '\u{1F4D6}', 'Nebl\u00edn': '\u{1F32B}' };
      portraitEl.textContent = icons[currentSpeaker] || '\u{1F4AC}';
    }
    currentText = lines[lineIndex];
  }

  function show(speaker, textLines) {
    mount();
    currentSpeaker = speaker || '';
    lines = Array.isArray(textLines) ? textLines : [textLines || ''];
    lineIndex = 0;
    visible = true;
    collapsed = false;
    root.style.display = '';
    root.style.opacity = '1';
    var body = root.querySelector('.adv-narrative-body');
    var controls = root.querySelector('.adv-narrative-controls');
    if (body) body.style.display = '';
    if (controls) controls.style.display = '';
    var toggleBtn = root.querySelector('.adv-narrative-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = '\u2212';
      toggleBtn.setAttribute('aria-label', 'Ocultar narrativa');
    }
    showCurrentLine();
  }

  function hide() {
    visible = false;
    if (root) root.style.opacity = '0';
  }

  function setCaption(text) {
    mount();
    var captionEl = root.querySelector('.adv-narrative-caption');
    if (captionEl) {
      if (text) {
        captionEl.textContent = text;
        captionEl.style.display = '';
      } else {
        captionEl.style.display = 'none';
      }
    }
  }

  function isVisible() { return visible; }
  function getCurrentSpeaker() { return currentSpeaker; }
  function getCurrentText() { return currentText; }
  function getLineIndex() { return lineIndex; }
  function getLineCount() { return lines.length; }

  function destroy() {
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    visible = false;
    lines = [];
    lineIndex = 0;
  }

  return {
    mount: mount,
    show: show,
    hide: hide,
    setCaption: setCaption,
    advanceLine: advanceLine,
    isVisible: isVisible,
    getCurrentSpeaker: getCurrentSpeaker,
    getCurrentText: getCurrentText,
    getLineIndex: getLineIndex,
    getLineCount: getLineCount,
    setOnAdvance: function (fn) { onAdvance = fn; },
    setOnRepeat: function (fn) { onRepeat = fn; },
    setOnListen: function (fn) { onListen = fn; },
    destroy: destroy
  };
}
