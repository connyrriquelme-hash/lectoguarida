/**
 * debug-overlay.js
 * Debug overlay for engine V2 — shows FPS, entities, systems, etc.
 */

export function createDebugOverlay(container) {
  var overlay = null;
  var visible = false;
  var fpsHistory = [];
  var lastFrameTime = 0;

  function show() {
    if (visible) return;
    visible = true;
    overlay = document.createElement('div');
    overlay.className = 'engine-debug-overlay';
    overlay.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.85);color:#0f0;padding:12px 16px;border-radius:8px;font-family:monospace;font-size:12px;z-index:9999;min-width:280px;pointer-events:auto;';
    (container || document.body).appendChild(overlay);
  }

  function hide() {
    visible = false;
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  function update(context) {
    if (!visible || !overlay) return;
    var now = performance.now();
    var fps = lastFrameTime > 0 ? 1000 / (now - lastFrameTime) : 0;
    lastFrameTime = now;
    fpsHistory.push(fps);
    if (fpsHistory.length > 60) fpsHistory.shift();
    var avgFps = fpsHistory.reduce(function (a, b) { return a + b; }, 0) / fpsHistory.length;

    var entityCount = context.entityManager ? context.entityManager.count : 0;
    var scene = context.sceneManager ? context.sceneManager.getActiveScene() : null;
    var gameTime = context.gameTime;
    var systems = context.systemManager ? context.systemManager.getSystems() : [];
    var activeSystems = systems.filter(function (s) { return s._enabled; }).length;

    var html = '<div style="color:#0f0;font-weight:bold;margin-bottom:4px;">Engine V2 Debug</div>';
    html += '<div>FPS: ' + Math.round(avgFps) + '</div>';
    html += '<div>Delta: ' + (gameTime ? gameTime.deltaTime.toFixed(4) : '0') + 's</div>';
    html += '<div>Elapsed: ' + (gameTime ? gameTime.elapsed.toFixed(1) : '0') + 's</div>';
    html += '<div>Entities: ' + entityCount + '</div>';
    html += '<div>Systems: ' + activeSystems + '/' + systems.length + '</div>';
    html += '<div>Scene: ' + (scene ? scene.id : 'none') + '</div>';

    overlay.innerHTML = html;
  }

  function isVisible() { return visible; }

  return {
    show: show,
    hide: hide,
    update: update,
    isVisible: isVisible
  };
}
