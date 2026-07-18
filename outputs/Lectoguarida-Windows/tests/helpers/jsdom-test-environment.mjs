/**
 * jsdom-test-environment.mjs
 *
 * Entorno de prueba compartido para los tests del modo No Lectores.
 * Centraliza la creación de JSDOM y el teardown para garantizar que
 * `node --test` termine con el proceso limpio (sin handles colgados).
 *
 * Soluciona el hang global: jsdom deja un Socket vivo tras window.close()
 * y los bucles de animación (requestAnimationFrame) quedan como timers
 * pendientes. Este helper rastrea timers, intervalos, AbortControllers y
 * engines, y en cleanupTestEnvironment los cancela explícitamente.
 */

import { JSDOM } from 'jsdom';

const doms = new Set();
const timers = new Set();
const intervals = new Set();
const abortControllers = new Set();
const engines = new Set();
const restoredGlobals = [];

export function createTestDom(options = {}) {
  const dom = new JSDOM(
    options.html || '<!DOCTYPE html><html><body><div id="container"></div></body></html>',
    {
      url: options.url || 'http://localhost:3000/expedicion/solo/juego/non_reader/rim-catcher',
      pretendToBeVisual: options.pretendToBeVisual !== false
    }
  );

  const raf = (cb) => {
    const id = setTimeout(() => {
      timers.delete(id);
      cb(Date.now());
    }, options.rafDelay != null ? options.rafDelay : 16);
    timers.add(id);
    return id;
  };
  const caf = (id) => {
    clearTimeout(id);
    timers.delete(id);
  };

  dom.window.requestAnimationFrame = raf;
  dom.window.cancelAnimationFrame = caf;

  // rAF global por si el código de producción usa el global en vez de window.*
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = raf;
    globalThis.cancelAnimationFrame = caf;
    restoredGlobals.push(() => {
      delete globalThis.requestAnimationFrame;
      delete globalThis.cancelAnimationFrame;
    });
  }

  doms.add(dom);
  return dom;
}

export function trackDom(dom) {
  doms.add(dom);
  return dom;
}

export function trackTimer(id) {
  timers.add(id);
  return id;
}

export function trackInterval(id) {
  intervals.add(id);
  return id;
}

export function trackAbortController(ac) {
  if (ac) abortControllers.add(ac);
  return ac;
}

export function trackEngine(engine) {
  if (engine) engines.add(engine);
  return engine;
}

/**
 * Mock determinista de fetch para AssetLoader.
 * Soporta: manifest JSON, SVG, MIME correcto/incorrecto, 404, timeout/abort,
 * y error de red. No usa la red ni el sistema de archivos.
 */
export function createFetchMock(opts = {}) {
  const handlers = opts.handlers || {};
  return function fetchMock(url, fetchOpts) {
    if (handlers[url]) return handlers[url](url, fetchOpts);
    if (opts.networkError) {
      return Promise.reject(new Error(opts.networkError));
    }
    if (opts.timeout) {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), opts.timeout);
        if (fetchOpts && fetchOpts.signal) {
          fetchOpts.signal.addEventListener('abort', () => {
            clearTimeout(t);
            reject(new Error('aborted'));
          });
        }
      });
    }
    const body = opts.body != null ? opts.body : '<svg/>';
    const type = opts.contentType || 'image/svg+xml';
    return Promise.resolve({
      ok: opts.ok !== false,
      status: opts.status || 200,
      headers: { get: () => type },
      text: () => Promise.resolve(body)
    });
  };
}

/**
 * Detiene la animación: convierte requestAnimationFrame en no-op para que
 * cualquier bucle (p. ej. falling-items) deje de reprogramarse.
 */
export function neutralizeAnimation() {
  const noop = () => 0;
  try { globalThis.requestAnimationFrame = noop; } catch (e) { /* ignore */ }
  try { globalThis.cancelAnimationFrame = () => {}; } catch (e) { /* ignore */ }
  for (const dom of doms) {
    try {
      dom.window.requestAnimationFrame = noop;
      dom.window.cancelAnimationFrame = () => {};
    } catch (e) { /* ignore */ }
  }
}

/**
 * Cancela todo lo rastreado y cierra los JSDOM para que el proceso termine.
 */
export function cleanupTestEnvironment() {
  neutralizeAnimation();

  for (const ac of abortControllers) {
    try { ac.abort(); } catch (e) { /* ignore */ }
  }
  abortControllers.clear();

  for (const engine of engines) {
    try { if (typeof engine.pauseGame === 'function') engine.pauseGame(); } catch (e) { /* ignore */ }
    try { if (typeof engine.stop === 'function') engine.stop(); } catch (e) { /* ignore */ }
    try { if (typeof engine.destroy === 'function') engine.destroy(); } catch (e) { /* ignore */ }
  }
  engines.clear();

  for (const id of intervals) {
    try { clearInterval(id); } catch (e) { /* ignore */ }
  }
  intervals.clear();

  for (const id of timers) {
    try { clearTimeout(id); } catch (e) { /* ignore */ }
  }
  timers.clear();

  for (const dom of doms) {
    try { dom.window.close(); } catch (e) { /* ignore */ }
  }
  doms.clear();

  while (restoredGlobals.length) {
    try { restoredGlobals.pop()(); } catch (e) { /* ignore */ }
  }

  // Barrido final de handles activos del proceso (p. ej. Socket de jsdom).
  try {
    const handles = (process._getActiveHandles && process._getActiveHandles()) || [];
    if (process.env.JTDIAG) {
      const reqs = (process._getActiveRequests && process._getActiveRequests()) || [];
      console.error('[JT] active handles before sweep:', handles.map(h => h && h.constructor && h.constructor.name).join(','));
      console.error('[JT] active requests before sweep:', reqs.length, reqs.map(r => r && r.constructor && r.constructor.name).join(','));
    }
    for (const h of handles) {
      try { if (typeof h.close === 'function') h.close(); } catch (e) { /* ignore */ }
      try { if (typeof h.destroy === 'function') h.destroy(); } catch (e) { /* ignore */ }
      try { if (typeof h.unref === 'function') h.unref(); } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }

  if (process.env.JTDIAG) {
    process.once('beforeExit', () => console.error('[JT] beforeExit fired; handles=', process._getActiveHandles().length, 'requests=', process._getActiveRequests().length));
  }

  if (process.env.JTEXIT) {
    console.error('[JT] forcing process.exit(0)');
    process.exit(0);
  }
}

export function getTrackedCounts() {
  return {
    doms: doms.size,
    timers: timers.size,
    intervals: intervals.size,
    abortControllers: abortControllers.size,
    engines: engines.size
  };
}
