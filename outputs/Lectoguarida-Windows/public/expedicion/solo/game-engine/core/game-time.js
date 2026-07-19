/**
 * game-time.js
 * Time management for the game loop. Handles delta, fixed timestep, and time scaling.
 */

var FIXED_TIMESTEP = 1 / 60;
var MAX_FRAME_DELTA = 0.25;
var MAX_ACCUMULATOR = 0.1;

export function createGameTime() {
  var timeScale = 1;
  var deltaTime = 0;
  var fixedDeltaTime = FIXED_TIMESTEP;
  var elapsed = 0;
  var frameCount = 0;
  var lastTimestamp = 0;
  var accumulator = 0;
  var paused = false;

  function update(timestamp) {
    if (paused) {
      deltaTime = 0;
      return;
    }
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp;
      return;
    }
    var raw = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    if (raw > MAX_FRAME_DELTA) raw = MAX_FRAME_DELTA;
    deltaTime = raw * timeScale;
    accumulator += deltaTime;
    if (accumulator > MAX_ACCUMULATOR) accumulator = MAX_ACCUMULATOR;
    elapsed += deltaTime;
    frameCount++;
  }

  function consumeFixed() {
    if (paused) return 0;
    if (accumulator >= fixedDeltaTime) {
      accumulator -= fixedDeltaTime;
      return fixedDeltaTime;
    }
    return 0;
  }

  function setPaused(p) { paused = p; }
  function setTimeScale(s) { timeScale = Math.max(0, Math.min(10, s)); }
  function reset() { lastTimestamp = 0; accumulator = 0; deltaTime = 0; elapsed = 0; frameCount = 0; }

  return {
    get deltaTime() { return deltaTime; },
    get fixedDeltaTime() { return fixedDeltaTime; },
    get elapsed() { return elapsed; },
    get frameCount() { return frameCount; },
    get timeScale() { return timeScale; },
    get paused() { return paused; },
    update: update,
    consumeFixed: consumeFixed,
    setPaused: setPaused,
    setTimeScale: setTimeScale,
    reset: reset,
    FIXED_TIMESTEP: FIXED_TIMESTEP,
    MAX_FRAME_DELTA: MAX_FRAME_DELTA
  };
}
