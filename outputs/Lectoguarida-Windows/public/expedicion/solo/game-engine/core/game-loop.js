/**
 * game-loop.js
 * Decoupled game loop with fixed timestep for physics and variable for rendering.
 */

import { createGameTime } from './game-time.js';

export function createGameLoop(callbacks) {
  callbacks = callbacks || {};
  var time = createGameTime();
  var rafId = null;
  var running = false;
  var documentHidden = false;

  function onFrame(timestamp) {
    if (!running) return;
    rafId = requestAnimationFrame(onFrame);

    if (documentHidden) return;

    time.update(timestamp);

    if (callbacks.fixedUpdate) {
      var fixedStep = time.consumeFixed();
      while (fixedStep > 0) {
        try { callbacks.fixedUpdate(fixedStep); } catch (e) { /* swallow */ }
        fixedStep = time.consumeFixed();
      }
    }

    if (callbacks.update) {
      try { callbacks.update(time.deltaTime); } catch (e) { /* swallow */ }
    }

    if (callbacks.lateUpdate) {
      try { callbacks.lateUpdate(time.deltaTime); } catch (e) { /* swallow */ }
    }

    if (callbacks.render) {
      try { callbacks.render(time.deltaTime); } catch (e) { /* swallow */ }
    }
  }

  function start() {
    if (running) return;
    running = true;
    time.reset();
    document.addEventListener('visibilitychange', onVisibilityChange);
    rafId = requestAnimationFrame(onFrame);
  }

  function stop() {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function pause() {
    time.setPaused(true);
  }

  function resume() {
    time.setPaused(false);
  }

  function onVisibilityChange() {
    documentHidden = document.hidden;
    if (documentHidden) {
      time.setPaused(true);
    } else {
      time.setPaused(false);
      time.reset();
    }
  }

  function destroy() {
    stop();
  }

  return {
    start: start,
    stop: stop,
    pause: pause,
    resume: resume,
    destroy: destroy,
    getTime: function () { return time; },
    isRunning: function () { return running; }
  };
}
