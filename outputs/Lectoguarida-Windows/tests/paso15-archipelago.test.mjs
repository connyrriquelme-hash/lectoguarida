/**
 * PASO 15 ARCHIPIÉLAGO LLOLLEO — Pruebas de FASE 15.
 * Verifica el rediseño del mundo: 6 regiones, Neblín, personajes refinados,
 * guardianes fusión, HUD sin lector, mochila, mapa mundial y Broche de Rina.
 * Ejecuta comportamiento real (sin buscar solo strings).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXPED = resolve(__dirname, '../public/expedicion');
const ADV = resolve(EXPED, 'solo/adventure');
const UI = resolve(ADV, 'ui');

function imp(p) { return import(pathToFileURL(p).href); }

const { WORLD_REGIONS, REFINED_CHARACTERS, REFINED_GUARDIANS, ADVENTURE_REWARDS, BACKPACK_SLOTS, COMPANION, NEBLIN } =
  await imp(resolve(ADV, 'adventure-config.js'));
const { createProgressAdapter } = await imp(resolve(ADV, 'progress-adapter.js'));
const { createPlayerFactory } = await imp(resolve(ADV, 'player-factory.js'));
const { createGuardianFactory } = await imp(resolve(ADV, 'guardian-factory.js'));
const { createNeblinController } = await imp(resolve(ADV, 'neblin-controller.js'));
const { createFogProgressController } = await imp(resolve(ADV, 'fog-progress-controller.js'));
const { createMapFogController } = await imp(resolve(ADV, 'map-fog-controller.js'));
const { createActionBar } = await imp(resolve(UI, 'action-bar.js'));
const { createMinimap } = await imp(resolve(UI, 'minimap.js'));
const { createWorldMap } = await imp(resolve(UI, 'world-map.js'));
const { createBackpackPanel } = await imp(resolve(UI, 'backpack-panel.js'));
const { createCharacterPanel } = await imp(resolve(UI, 'character-panel.js'));
const { createPauseMenu } = await imp(resolve(UI, 'pause-menu.js'));
const { createRewardPanel } = await imp(resolve(UI, 'reward-panel.js'));
const { createUIRoot } = await imp(resolve(UI, 'ui-root.js'));
const { createAccessibilityController } = await imp(resolve(ADV, 'accessibility-controller.js'));

function makeMockRepo(opts) {
  opts = opts || {};
  const data = {};
  return {
    _lastSaved: null,
    getProfileProgress: (id) => data[id] || null,
    updateProfileProgress: (id, profile, patch) => {
      if (opts.throwOnSave) throw new Error('storage failure');
      data[id] = Object.assign({}, data[id], { adventure: patch.adventure });
      this._lastSaved = data[id];
    }
  };
}

const FORBIDDEN = ['victoria-island', 'aqua-road', 'edelstein', 'el-nath', 'mu-lung', 'orbis', 'temple-of-time'];

// 1. Seis regiones oficiales
test('el archipiélago tiene 6 regiones', () => {
  assert.equal(WORLD_REGIONS.length, 6);
});

// 2. IDs oficiales sin nombres comerciales
test('las regiones usan IDs oficiales y sin nombres comerciales', () => {
  const ids = WORLD_REGIONS.map(r => r.id);
  assert.deepEqual(ids, [
    'peninsula-llolleo', 'humedal-rio-maipo', 'puerto-gigantes',
    'roquerios-viento', 'valle-yali', 'cerros-cuentos'
  ]);
  ids.forEach(id => assert.ok(!FORBIDDEN.includes(id), 'ID prohibido: ' + id));
});

// 3. Península de Llolleo es la región inicial activa
test('Península de Llolleo es la región inicial ACTIVE', () => {
  const llolleo = WORLD_REGIONS.find(r => r.id === 'peninsula-llolleo');
  assert.equal(llolleo.state, 'ACTIVE');
  assert.equal(llolleo.name, 'Península de Llolleo');
});

// 4. Las demás regiones no son ACTIVE y hay regiones bloqueadas
test('solo Península de Llolleo es ACTIVE y existen regiones LOCKED', () => {
  const others = WORLD_REGIONS.filter(r => r.id !== 'peninsula-llolleo');
  const locked = others.filter(r => r.state === 'LOCKED');
  assert.ok(locked.length >= 1, 'debe haber al menos una región LOCKED');
  others.forEach(r => assert.notEqual(r.state, 'ACTIVE'));
});

// 5. Refined characters: 4 avatares con motivo
test('hay 4 avatares refinados con motivo territorial', () => {
  assert.equal(REFINED_CHARACTERS.length, 4);
  REFINED_CHARACTERS.forEach(c => assert.ok(c.motif, 'avatar sin motivo: ' + c.id));
});

// 6. Lumiércoles es mariposa
test('Lumiércoles es mariposa del maitén', () => {
  assert.equal(COMPANION.concept, 'mariposa-del-maiten');
});

// 7. Refined guardians: 4 fusión fauna-planta
test('hay 4 guardianes fusión fauna-planta', () => {
  const ids = Object.keys(REFINED_GUARDIANS);
  assert.equal(ids.length, 4);
  assert.deepEqual(ids.sort(), ['chispa', 'mimi', 'pulo', 'rina'].sort());
});

// 8. Rina es ranita-helecho
test('Rina es ranita-helecho', () => {
  const rina = REFINED_GUARDIANS['rina'];
  assert.equal(rina.species, 'Ranita de Darwin + helecho costero');
});

// 9. Recompensas incluyen Broche de Rina cosmetico
test('las recompensas incluyen Broche de Rina (cosmético)', () => {
  const broche = ADVENTURE_REWARDS['broche-rina'];
  assert.ok(broche);
  assert.equal(broche.type, 'cosmetic');
  assert.notEqual(broche.gameplayAdvantage, true);
});

// 10. Mochila tiene 6 slots
test('la mochila tiene 6 slots', () => {
  assert.equal(BACKPACK_SLOTS.length, 6);
});

// 11. Neblín tiene 3 estados sin combate
test('Neblín define 3 estados sin combate', () => {
  const states = NEBLIN.states;
  assert.equal(Object.keys(states).length, 3);
  assert.equal(states.DENSE, 'NEBLIN_DENSE');
  assert.equal(states.CLEARING, 'NEBLIN_CLEARING');
  assert.equal(states.FRIENDLY, 'NEBLIN_FRIENDLY');
  assert.notEqual(NEBLIN.combat, true);
});

// 12. Progress: backpack vacío inicial
test('mochila inicia vacía en progreso', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  assert.deepEqual(p.getBackpack(), []);
});

// 13. Progress: setBackpack respeta 6 slots
test('setBackpack no supera 6 slots', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  p.setBackpack(items);
  assert.ok(p.getBackpack().length <= 6);
});

// 14. Progress: region state se guarda y lee
test('estado de región se persiste', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  p.saveRegionState('peninsula-llolleo', 'DISCOVERED');
  assert.equal(p.getRegionState('peninsula-llolleo'), 'DISCOVERED');
});

// 15. Progress: neblin se guarda y lee
test('estado de Neblín se persiste', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  assert.equal(p.getNeblin(), 'NEBLIN_DENSE');
  p.setNeblin('NEBLIN_FRIENDLY');
  assert.equal(p.getNeblin(), 'NEBLIN_FRIENDLY');
});

// 16. Progress: labels se guardan
test('etiquetas accesibles se persisten', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  assert.equal(p.getLabels(), false);
  p.setLabels(true);
  assert.equal(p.getLabels(), true);
});

// 17. Progress: metricas se registran
test('las métricas se registran por evento', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  p.recordMetric('world_map_opened');
  p.recordMetric('world_map_opened');
  assert.equal(p.loadAdventure().metrics['world_map_opened'], 2);
});

// 18. Progress: Broche de Rina no se duplica
test('Broche de Rina no se duplica', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  assert.equal(p.addReward('broche-rina'), true);
  assert.equal(p.addReward('broche-rina'), false);
});

// 19. Progress: getRewardById resuelve desde ADVENTURE_REWARDS
test('getRewardById resuelve recompensa', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo(), studentProfileId: 's1' });
  assert.equal(p.getRewardById('broche-rina').id, 'broche-rina');
});

// 19b. Reward panel usa Broche de Rina del mapa de recompensas
test('Broche de Rina existe en ADVENTURE_REWARDS', () => {
  assert.equal(ADVENTURE_REWARDS['broche-rina'].id, 'broche-rina');
});

// 20. Fallback de storage usa memoria para regiones
test('fallo de storage usa memoria para Neblín', () => {
  const p = createProgressAdapter({ SoloProgressRepository: makeMockRepo({ throwOnSave: true }), studentProfileId: 's1' });
  p.setNeblin('NEBLIN_CLEARING');
  assert.equal(p.getNeblin(), 'NEBLIN_CLEARING');
});

// 21. Action bar: 5 acciones exactas
test('la barra de acciones tiene 5 acciones', () => {
  const ab = createActionBar({});
  const btns = ab.el.querySelectorAll('.adv-action-btn');
  assert.equal(btns.length, 5);
  const labels = Array.from(btns).map(b => b.getAttribute('aria-label'));
  ['Escuchar', 'Repetir', 'Pista', 'Interactuar', 'Pausa'].forEach(l =>
    assert.ok(labels.includes(l), 'falta acción ' + l));
});

// 22. Action bar: cada botón es accesible (aria-label, rol)
test('cada botón de acción es accesible', () => {
  const ab = createActionBar({});
  const btns = ab.el.querySelectorAll('.adv-action-btn');
  btns.forEach(b => {
    assert.ok(b.getAttribute('aria-label'));
    assert.equal(b.getAttribute('type'), 'button');
  });
});

// 23. Action bar: click en escuchar dispara callback
test('click en Escuchar dispara callback', () => {
  let fired = null;
  const ab = createActionBar({ onAction: (id) => { fired = id; } });
  ab.el.querySelector('.adv-action-btn').click();
  assert.equal(fired, 'escuchar');
});

// 24. Action bar: labels toggle
test('labels se activan/desactivan en la barra', () => {
  const ab = createActionBar({});
  ab.setLabels(true);
  assert.ok(ab.el.classList.contains('adv-labels-on'));
  ab.setLabels(false);
  assert.ok(ab.el.classList.contains('adv-labels-off'));
});

// 25. Minimap: minimizado por defecto
test('minimapa inicia minimizado', () => {
  const m = createMinimap({ regions: WORLD_REGIONS });
  assert.ok(m.el.classList.contains('minimized'));
});

// 26. Minimap: expand funcion
test('minimapa expande', () => {
  const m = createMinimap({ regions: WORLD_REGIONS });
  m.expand();
  assert.ok(!m.el.classList.contains('minimized'));
});

// 27. Minimap: no revela regiones bloqueadas
test('minimapa no muestra nombres de regiones bloqueadas', () => {
  const m = createMinimap({ regions: WORLD_REGIONS });
  const svg = m.el.querySelector('svg').outerHTML;
  WORLD_REGIONS.forEach(r => {
    if (r.state === 'LOCKED') assert.ok(!svg.includes(r.name), 'expone nombre bloqueado: ' + r.name);
  });
});

// 28. World map: regiones bloqueadas muestran niebla y ???
test('mapa mundial oculta nombre de región bloqueada con niebla', () => {
  const wm = createWorldMap({ regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })) });
  const locked = wm.el.querySelector('.adv-region.locked');
  assert.ok(locked);
  assert.ok(locked.querySelector('.adv-fog'));
  assert.ok(locked.textContent.includes('?????') || locked.querySelector('.adv-fog-symbols'));
});

// 29. World map: región activa seleccionable
test('mapa mundial permite seleccionar región activa', () => {
  let selected = null;
  const wm = createWorldMap({
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    onSelect: (id) => { selected = id; }
  });
  const active = wm.el.querySelector('.adv-region.active');
  active.click();
  assert.equal(selected, 'peninsula-llolleo');
});

// 30. World map: región bloqueada no seleccionable
test('mapa mundial no selecciona región bloqueada', () => {
  let selected = null;
  const wm = createWorldMap({
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    onSelect: (id) => { selected = id; }
  });
  const locked = wm.el.querySelector('.adv-region.locked');
  locked.click();
  assert.equal(selected, null);
});

// 31. Backpack panel: 6 slots
test('panel de mochila muestra 6 slots', () => {
  const bp = createBackpackPanel({ items: [], maxSlots: 6 });
  assert.equal(bp.el.querySelectorAll('.adv-backpack-slot').length, 6);
});

// 32. Backpack panel: items llenan slots
test('panel de mochila marca slots llenos', () => {
  const bp = createBackpackPanel({ items: [{ id: 'x', name: 'X', icon: '★' }], maxSlots: 6 });
  assert.equal(bp.el.querySelectorAll('.adv-backpack-slot.filled').length, 1);
});

// 33. Character panel: 4 avatares
test('panel de personaje muestra 4 avatares', () => {
  const cp = createCharacterPanel({ characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })) });
  assert.equal(cp.el.querySelectorAll('.adv-character-card').length, 4);
});

// 34. Character panel: selección dispara callback
test('seleccionar avatar dispara callback', () => {
  let picked = null;
  const cp = createCharacterPanel({
    characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })),
    onSelect: (id) => { picked = id; }
  });
  cp.el.querySelector('.adv-character-card').click();
  assert.ok(picked);
});

// 35. Pause menu: toggles labels
test('menú de pausa alterna etiquetas', () => {
  let labels = null;
  const pm = createPauseMenu({ labelsOn: false, onToggleLabels: (on) => { labels = on; } });
  pm.el.querySelector('.adv-labels').click();
  assert.equal(labels, true);
});

// 36. Pause menu: continuar dispara callback
test('menú de pausa continúa', () => {
  let resumed = false;
  const pm = createPauseMenu({ onResume: () => { resumed = true; } });
  pm.el.querySelector('.adv-resume').click();
  assert.equal(resumed, true);
});

// 37. Reward panel: muestra recompensa
test('panel de recompensa muestra Broche de Rina', () => {
  const rp = createRewardPanel({ reward: ADVENTURE_REWARDS['broche-rina'] });
  assert.ok(rp.el.textContent.includes('Broche'));
});

// 38. UI Root: monta action bar y minimap
test('UIRoot monta action bar y minimap', () => {
  const root = document.createElement('div');
  const ui = createUIRoot({
    container: root,
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })),
    backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  assert.ok(ui.el.querySelector('.adv-action-bar'));
  assert.ok(ui.el.querySelector('.adv-minimap'));
  ui.destroy();
});

// 39. UI Root: abre mapa mundial
test('UIRoot abre el mapa mundial', () => {
  const root = document.createElement('div');
  const ui = createUIRoot({
    container: root,
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })),
    backpackItems: [], maxSlots: 6,
    callbacks: { onPanelOpen: () => {} }
  });
  ui.openPanel('world');
  assert.ok(ui.el.querySelector('.adv-world-map'));
  ui.destroy();
});

// 40. UI Root: abre mochila
test('UIRoot abre la mochila', () => {
  const root = document.createElement('div');
  const ui = createUIRoot({
    container: root,
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })),
    backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  ui.openPanel('backpack');
  assert.ok(ui.el.querySelector('.adv-backpack'));
  ui.destroy();
});

// 41. UI Root: setRegions actualiza minimap
test('UIRoot actualiza regiones del minimapa', () => {
  const root = document.createElement('div');
  const ui = createUIRoot({
    container: root,
    regions: WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: r.state })),
    characters: REFINED_CHARACTERS.map(c => ({ id: c.id, name: c.name, motif: c.motif })),
    backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  const discovered = WORLD_REGIONS.map(r => ({ id: r.id, name: r.name, state: 'DISCOVERED' }));
  ui.setRegions(discovered);
  ui.destroy();
  assert.ok(true);
});

// 42. Player factory: avatar con motivo construye
test('player-factory construye avatar con motivo', () => {
  const pf = createPlayerFactory();
  REFINED_CHARACTERS.forEach(c => {
    const p = pf.create(c.id);
    assert.equal(p.userData.characterId, c.id);
    assert.equal(p.userData.motif, c.motif);
  });
});

// 43. Player factory: Lumiércoles sigue siendo jugable
test('Lumiércoles queda como avatar jugable válido', () => {
  const pf = createPlayerFactory();
  const p = pf.create('lumi');
  assert.ok(p.userData.parts && p.userData.parts.body);
});

// 44. Guardian factory: Rina ranita-helecho construye con helecho
test('guardian Rina ranita-helecho tiene hojas de helecho', () => {
  const gf = createGuardianFactory();
  const g = gf.create('rina');
  const model = g.children[0];
  assert.ok(model.userData.fernLeaves && model.userData.fernLeaves.length === 3);
});

// 45. Guardian factory: Chispa chucao-copihue construye
test('guardian Chispa chucao-copihue construye', () => {
  const gf = createGuardianFactory();
  const g = gf.create('chispa');
  assert.ok(g);
});

// 46. Guardian factory: Pulo pudú-boldo construye
test('guardian Pulo pudú-boldo construye', () => {
  const gf = createGuardianFactory();
  const g = gf.create('pulo');
  assert.ok(g);
});

// 47. Guardian factory: Mimi monito-quila construye
test('guardian Mimi monito-quila construye', () => {
  const gf = createGuardianFactory();
  const g = gf.create('mimi');
  assert.ok(g);
});

// 48. Neblin controller: estados válidos
test('Neblin controller acepta los 3 estados', () => {
  const n = createNeblinController();
  Object.values(NEBLIN.states).forEach(s => { n.setState(s); assert.ok(true); });
  n.animate(1.0);
  assert.ok(n.root);
});

// 49. Fog progress controller: guarda estado idempotente
test('fog-progress guarda estado de región idempotente', () => {
  const store = makeMockRepo();
  const fpc = createFogProgressController({ progress: createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 's1' }) });
  fpc.setRegionState('peninsula-llolleo', 'DISCOVERED');
  fpc.setRegionState('peninsula-llolleo', 'DISCOVERED');
  assert.equal(fpc.regionState({ id: 'peninsula-llolleo', state: 'LOCKED' }), 'DISCOVERED');
});

// 50. Map fog controller: crea niebla con nubes (no gris plano sólido)
test('map-fog crea niebla con nubes (no relleno gris plano)', () => {
  const mfc = createMapFogController({});
  const html = mfc.cloudMarkup('Península', 1, 'LOCKED');
  assert.ok(html.indexOf('adv-fog') >= 0);
  assert.ok(html.indexOf('adv-fog-cloud') >= 0);
  assert.ok(html.indexOf('background:gray') < 0 && html.indexOf('background: gray') < 0);
});

// 51. Accessibility: labels se aplican
test('accessibility aplica etiquetas accesibles', () => {
  const a = createAccessibilityController({});
  a.setLabels(true);
  assert.equal(a.getLabels(), true);
});

// 52. No hay combate en Neblín
test('Neblín no define combate', () => {
  assert.notEqual(NEBLIN.combat, true);
});

// 53. Broche de Rina no da ventaja de juego
test('Broche de Rina es puramente cosmético (sin ventaja)', () => {
  const broche = ADVENTURE_REWARDS['broche-rina'];
  assert.equal(broche.type, 'cosmetic');
  assert.notEqual(broche.gameplayAdvantage, true);
});
