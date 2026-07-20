/**
 * fake-animation-frame.mjs
 *
 * Deterministic requestAnimationFrame / cancelAnimationFrame scheduler
 * for Node.js test environments. No real timers, no Math.random, no Date.now IDs.
 *
 * Usage:
 *   import { createFakeAnimationFrame } from '../helpers/fake-animation-frame.mjs';
 *   constraf = createFakeAnimationFrame();
 *   // install via raf.requestAnimationFrame / raf.cancelAnimationFrame
 *   // raf.flushNextFrame()  – execute exactly one pending callback
 *   // raf.flushAllFrames()  – drain every pending callback
 *   // raf.restore()         – restore original globals
 */

let nextId = 1;

export function createFakeAnimationFrame() {
  const callbacks = new Map();
  const savedGlobals = {};

  function requestAnimationFrame(callback) {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  }

  function cancelAnimationFrame(id) {
    callbacks.delete(id);
  }

  function flushNextFrame(timestamp) {
    const entries = Array.from(callbacks.entries());
    if (entries.length === 0) return false;
    const [id, callback] = entries[0];
    callbacks.delete(id);
    callback(timestamp || 0);
    return true;
  }

  function flushAllFrames(timestamp) {
    while (flushNextFrame(timestamp)) { /* drain */ }
  }

  function pendingCount() {
    return callbacks.size;
  }

  function restore() {
    callbacks.clear();
    if ('requestAnimationFrame' in savedGlobals) {
      globalThis.requestAnimationFrame = savedGlobals.requestAnimationFrame;
    } else {
      delete globalThis.requestAnimationFrame;
    }
    if ('cancelAnimationFrame' in savedGlobals) {
      globalThis.cancelAnimationFrame = savedGlobals.cancelAnimationFrame;
    } else {
      delete globalThis.cancelAnimationFrame;
    }
    if ('window' in savedGlobals) {
      globalThis.window = savedGlobals.window;
    } else {
      delete globalThis.window;
    }
    if ('document' in savedGlobals) {
      globalThis.document = savedGlobals.document;
    } else {
      delete globalThis.document;
    }
  }

  function install() {
    savedGlobals.requestAnimationFrame = globalThis.requestAnimationFrame;
    savedGlobals.cancelAnimationFrame = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = requestAnimationFrame;
    globalThis.cancelAnimationFrame = cancelAnimationFrame;
  }

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    flushNextFrame,
    flushAllFrames,
    pendingCount,
    restore,
    install
  };
}
