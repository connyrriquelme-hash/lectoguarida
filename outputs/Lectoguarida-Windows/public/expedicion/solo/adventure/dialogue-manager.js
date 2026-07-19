/**
 * dialogue-manager.js
 * Reproduce líneas de diálogo una a una con audio opcional.
 */

export function createDialogueManager(deps) {
  var audio = deps.audio;
  var onChange = deps.onChange;
  var queue = [];
  var index = 0;
  var speaker = null;
  var active = false;

  function start(lines, speakerName) {
    queue = lines || [];
    index = 0;
    speaker = speakerName || null;
    active = queue.length > 0;
    showCurrent();
  }

  function showCurrent() {
    if (index >= queue.length) { active = false; if (onChange) onChange(null, true); return; }
    var line = queue[index];
    if (onChange) onChange({ speaker: speaker, text: line, index: index, total: queue.length }, false);
    if (audio) audio.speak(line);
  }

  function next() {
    if (!active) return;
    index++;
    showCurrent();
  }

  function isActive() { return active; }

  function current() {
    if (index >= queue.length) return null;
    return { speaker: speaker, text: queue[index], index: index, total: queue.length };
  }

  return {
    start: start,
    next: next,
    isActive: isActive,
    current: current,
    stop: function () { active = false; queue = []; index = 0; if (audio) audio.cancel(); }
  };
}
