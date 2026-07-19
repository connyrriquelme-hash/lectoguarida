/**
 * ui-root.js
 * Orquesta todos los módulos de UI sobre el contenedor de la escena.
 * No construye HUD propio: delega en action-bar, minimap, world-map, backpack, reward, character, pause.
 */

import { createUIStateManager } from './ui-state-manager.js';
import { createActionBar } from './action-bar.js';
import { createMinimap } from './minimap.js';
import { createWorldMap } from './world-map.js';
import { createBackpackPanel } from './backpack-panel.js';
import { createRewardPanel } from './reward-panel.js';
import { createCharacterPanel } from './character-panel.js';
import { createPauseMenu } from './pause-menu.js';
import { ADVENTURE_UI_CSS } from './adventure-ui.css.js';

export function injectAdventureUICSS() {
  if (document.getElementById('adv-ui-css')) return;
  var s = document.createElement('style');
  s.id = 'adv-ui-css';
  s.textContent = ADVENTURE_UI_CSS;
  document.head.appendChild(s);
}

export function createUIRoot(opts) {
  opts = opts || {};
  var container = opts.container;
  var callbacks = opts.callbacks || {};
  injectAdventureUICSS();
  var state = createUIStateManager();

  var node = document.createElement('div');
  node.className = 'adv-ui-root';
  node.style.position = 'absolute';
  node.style.inset = '0';
  node.style.pointerEvents = 'none';
  container.appendChild(node);

  var refs = {};
  var regions = opts.regions || [];
  var characters = opts.characters || [];
  var backpackItems = opts.backpackItems || [];
  var maxSlots = opts.maxSlots || 6;

  // Action bar
  refs.actionBar = createActionBar({
    onAction: function (id) {
      if (id === 'pausa') { openPanel('pause'); return; }
      if (callbacks.onAction) callbacks.onAction(id);
    }
  });
  node.appendChild(refs.actionBar.el);

  // Minimap
  refs.minimap = createMinimap({
    regions: regions,
    onOpenMap: function () { openPanel('world'); }
  });
  node.appendChild(refs.minimap.el);

  // Backpack quick view
  refs.backpackQuick = document.createElement('div');
  refs.backpackQuick.className = 'adv-backpack';
  refs.backpackQuick.style.position = 'absolute';
  refs.backpackQuick.style.right = '14px';
  refs.backpackQuick.style.top = '64px';
  refs.backpackQuick.style.pointerEvents = 'auto';
  refs.backpackQuick.setAttribute('role', 'button');
  refs.backpackQuick.setAttribute('tabindex', '0');
  refs.backpackQuick.setAttribute('aria-label', 'Mochila. Pulsa para abrir.');
  function renderQuick() {
    var html = '';
    for (var i = 0; i < maxSlots; i++) {
      var it = backpackItems[i];
      html += it ? '<div class="adv-backpack-slot filled" title="' + (it.name || it.id) + '">' + (it.icon || '★') + '</div>'
                 : '<div class="adv-backpack-slot"></div>';
    }
    refs.backpackQuick.innerHTML = html;
  }
  renderQuick();
  refs.backpackQuick.addEventListener('click', function () { openPanel('backpack'); });
  refs.backpackQuick.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel('backpack'); } });
  node.appendChild(refs.backpackQuick);

  function mountPanel(panel) {
    if (refs.currentPanel) refs.currentPanel.destroy();
    refs.currentPanel = panel;
    node.appendChild(panel.el);
  }

  function openPanel(name) {
    state.openPanel(name);
    if (name === 'world') {
      mountPanel(createWorldMap({ regions: regions, onSelect: function (id) { if (callbacks.onRegionSelect) callbacks.onRegionSelect(id); closePanel(); }, onClose: closePanel }));
    } else if (name === 'backpack') {
      mountPanel(createBackpackPanel({ items: backpackItems, maxSlots: maxSlots, onClose: closePanel }));
    } else if (name === 'character') {
      mountPanel(createCharacterPanel({ characters: characters, selectedId: state.get().selectedCharacterId, onSelect: function (id) { state.setSelectedCharacter(id); if (callbacks.onCharacterSelect) callbacks.onCharacterSelect(id); }, onClose: closePanel }));
    } else if (name === 'reward') {
      if (callbacks.onRewardOpen) callbacks.onRewardOpen();
    } else if (name === 'pause') {
      mountPanel(createPauseMenu({ labelsOn: state.get().labelsOn, onResume: closePanel, onToggleLabels: function (on) { state.setLabels(on); if (callbacks.onToggleLabels) callbacks.onToggleLabels(on); refs.actionBar.setLabels(on); }, onRestartZone: function () { if (callbacks.onRestartZone) callbacks.onRestartZone(); closePanel(); } }));
    }
    if (callbacks.onPanelOpen) callbacks.onPanelOpen(name);
  }

  function closePanel() {
    state.closePanel();
    if (refs.currentPanel) { refs.currentPanel.destroy(); refs.currentPanel = null; }
  }

  // subscribe labels
  state.subscribe(function (evt) {
    if (evt.type === 'labels') refs.actionBar.setLabels(evt.on);
  });

  return {
    el: node,
    state: state,
    openPanel: openPanel,
    closePanel: closePanel,
    openCharacterPanel: function () { openPanel('character'); },
    showReward: function (reward) {
      if (reward) mountPanel(createRewardPanel({ reward: reward, onClose: closePanel }));
      else closePanel();
    },
    setRegions: function (r) { regions = r; refs.minimap.update(r); if (refs.currentPanel && refs.currentPanel.update) refs.currentPanel.update(r); },
    setBackpack: function (items, max) { backpackItems = items || backpackItems; if (max) maxSlots = max; renderQuick(); },
    setLabels: function (on) { state.setLabels(on); refs.actionBar.setLabels(on); },
    destroy: function () { if (refs.currentPanel) refs.currentPanel.destroy(); if (node.parentNode) node.parentNode.removeChild(node); }
  };
}
