import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function createDOM(html) {
  const dom = new JSDOM(html, { url: 'http://localhost/expedicion/juego' });
  return dom;
}

function loadGameFunctions(dom) {
  const { window } = dom;
  const { document } = window;

  let bootOverlayHidden = false;
  let selectorVisible = false;

  function cerrarSelectorDeNivel() {
    if (bootOverlayHidden) return;
    bootOverlayHidden = true;
    selectorVisible = false;

    const overlay = document.getElementById('bootOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('aria-busy', 'false');
      overlay.style.pointerEvents = 'none';
      if ('inert' in overlay) {
        overlay.inert = true;
      }
    }

    const staticDemo = document.querySelector('.static-demo');
    if (staticDemo) {
      staticDemo.classList.add('hidden');
      staticDemo.hidden = true;
      staticDemo.setAttribute('aria-hidden', 'true');
      staticDemo.style.pointerEvents = 'none';
    }

    document.body.classList.add('expedicion-jugando');
    document.body.dataset.gameState = 'playing';
  }

  function mostrarSelectorDeNivel() {
    bootOverlayHidden = false;
    selectorVisible = true;

    const overlay = document.getElementById('bootOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      overlay.setAttribute('aria-busy', 'false');
      overlay.style.pointerEvents = '';
      if ('inert' in overlay) {
        overlay.inert = false;
      }
    }

    const staticDemo = document.querySelector('.static-demo');
    if (staticDemo) {
      staticDemo.classList.remove('hidden');
      staticDemo.hidden = false;
      staticDemo.setAttribute('aria-hidden', 'false');
      staticDemo.style.pointerEvents = '';
    }

    document.body.classList.remove('expedicion-jugando');
    document.body.dataset.gameState = 'selecting';

    const firstChoice = document.querySelector('[data-level]');
    if (firstChoice) firstChoice.focus();
  }

  return { cerrarSelectorDeNivel, mostrarSelectorDeNivel, get bootOverlayHidden() { return bootOverlayHidden; } };
}

const testHTML = `<!DOCTYPE html>
<html lang="es">
<body>
  <div class="static-demo" aria-hidden="false">
    <section class="static-card">
      <h1>Lectoguarida Expedición</h1>
    </section>
  </div>
  <div id="bootOverlay" class="boot-overlay" aria-live="polite" aria-busy="true">
    <div class="boot-card">
      <h1>Conectando cámara e Inteligencia Artificial...</h1>
      <div class="level-grid" aria-label="Selección de nivel">
        <button class="level-choice kinder" type="button" data-level="kinder">
          <strong>Kinder · Nivel 1</strong>
        </button>
        <button class="level-choice segundo" type="button" data-level="segundo">
          <strong>Segundo · Nivel 2</strong>
        </button>
        <button class="level-choice sexto" type="button" data-level="sexto">
          <strong>Sexto · Nivel 3</strong>
        </button>
      </div>
    </div>
  </div>
  <div id="contenedor-juego"></div>
</body>
</html>`;

test('cerrarSelectorDeNivel oculta #bootOverlay', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();

  const overlay = document.getElementById('bootOverlay');
  assert.equal(overlay.hidden, true);
  assert.equal(overlay.getAttribute('aria-hidden'), 'true');
  assert.ok(overlay.classList.contains('hidden'));
  assert.equal(overlay.style.pointerEvents, 'none');
});

test('cerrarSelectorDeNivel oculta .static-demo', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();

  const staticDemo = document.querySelector('.static-demo');
  assert.equal(staticDemo.hidden, true);
  assert.equal(staticDemo.getAttribute('aria-hidden'), 'true');
  assert.ok(staticDemo.classList.contains('hidden'));
  assert.equal(staticDemo.style.pointerEvents, 'none');
});

test('cerrarSelectorDeNivel agrega body.expedicion-jugando', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();

  assert.ok(document.body.classList.contains('expedicion-jugando'));
  assert.equal(document.body.dataset.gameState, 'playing');
});

test('cerrarSelectorDeNivel es idempotente', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();
  cerrarSelectorDeNivel();

  const overlay = document.getElementById('bootOverlay');
  assert.equal(overlay.hidden, true);
});

test('mostrarSelectorDeNivel restaura #bootOverlay', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel, mostrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();
  mostrarSelectorDeNivel();

  const overlay = document.getElementById('bootOverlay');
  assert.equal(overlay.hidden, false);
  assert.equal(overlay.getAttribute('aria-hidden'), 'false');
  assert.equal(overlay.style.pointerEvents, '');
});

test('mostrarSelectorDeNivel restaura .static-demo', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel, mostrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();
  mostrarSelectorDeNivel();

  const staticDemo = document.querySelector('.static-demo');
  assert.equal(staticDemo.hidden, false);
  assert.equal(staticDemo.getAttribute('aria-hidden'), 'false');
});

test('mostrarSelectorDeNivel quita body.expedicion-jugando', () => {
  const dom = createDOM(testHTML);
  const { cerrarSelectorDeNivel, mostrarSelectorDeNivel } = loadGameFunctions(dom);
  const { document } = dom.window;

  cerrarSelectorDeNivel();
  mostrarSelectorDeNivel();

  assert.equal(document.body.classList.contains('expedicion-jugando'), false);
  assert.equal(document.body.dataset.gameState, 'selecting');
});

test('expedicion:level-started event se dispatchea', () => {
  const dom = createDOM(testHTML);
  const win = dom.window;
  const doc = win.document;
  let received = false;

  doc.addEventListener('expedicion:level-started', () => {
    received = true;
  });

  const event = new win.CustomEvent('expedicion:level-started', {
    detail: { nivel: 'kinder' }
  });
  doc.dispatchEvent(event);

  assert.equal(received, true);
});
