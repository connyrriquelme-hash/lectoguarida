/**
 * fallback-2d.js
 * Modo 2D accesible y jugable cuando WebGL no está disponible.
 * Conserva misión, audio, progreso y recompensas.
 */

import { CHAPTER_01 } from './adventure-config.js';
import { MISSION_COLLECTIBLES } from './data/collectibles.js';
import { ZONE_META } from './data/world-zones.js';
import { DIALOGUE } from './data/dialogue-es-cl.js';

export function createFallback2D(container, deps) {
  var audio = deps.audio;
  var progress = deps.progress;
  var onComplete = deps.onComplete;
  var root = document.createElement('div');
  root.className = 'adv-root adv-fallback';
  root.setAttribute('role', 'application');
  root.setAttribute('aria-label', 'Aventura Lectoguarida modo accesible');

  var mission = CHAPTER_01.mission;
  var found = progress.loadAdventure().collectiblesFound.filter(function (id) {
    return MISSION_COLLECTIBLES.some(function (c) { return c.id === id; });
  });
  if (found.length === 0 && progress.loadAdventure().characterId) {
    found = progress.loadAdventure().collectiblesFound.slice();
  }

  function render() {
    root.innerHTML = '';
    var header = document.createElement('div');
    header.className = 'adv-hud-header';
    header.innerHTML = '<div class="adv-logo">Lectoguarida Aventuras</div>' +
      '<div class="adv-stars">⭐ ' + progress.getStars() + '</div>';
    root.appendChild(header);

    var panel = document.createElement('div');
    panel.className = 'adv-mission-panel';
    panel.innerHTML = '<h3>' + mission.title + '</h3>' +
      '<p>Ayuda a Rina a recuperar las campanas de la rima.</p>' +
      '<div class="adv-progress"><div style="width:' + (found.length / mission.collectibleCount * 100) + '%"></div></div>';
    root.appendChild(panel);

    var dialogue = document.createElement('div');
    dialogue.className = 'adv-dialogue';
    dialogue.innerHTML = '<div class="speaker">Rina</div><div class="line">' + DIALOGUE.rina.greeting[0] + '</div>' +
      '<div class="actions"><button class="adv-btn" data-act="listen">♪ Escuchar</button>' +
      '<button class="adv-btn secondary" data-act="next">Continuar</button></div>';
    root.appendChild(dialogue);

    var list = document.createElement('div');
    list.style.cssText = 'position:absolute;left:14px;top:180px;right:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;';
    MISSION_COLLECTIBLES.forEach(function (c) {
      var got = found.indexOf(c.id) >= 0;
      var card = document.createElement('button');
      card.className = 'adv-character-card' + (got ? ' selected' : '');
      card.style.textAlign = 'center';
      card.innerHTML = '<div style="font-size:2rem;">🔔</div><div>' + c.word + '</div>' +
        '<div style="font-size:0.8rem;color:#666;">' + (got ? 'Encontrada' : 'Toca para recoger') + '</div>';
      card.setAttribute('aria-label', 'Campana ' + c.word + (got ? ' encontrada' : ''));
      if (!got) {
        card.addEventListener('click', function () {
          progress.markCollectible(c.id);
          found.push(c.id);
          audio.speak('¡Encontraste la campana ' + c.word + '!');
          render();
          checkComplete();
        });
      }
      list.appendChild(card);
    });
    root.appendChild(list);

    var back = document.createElement('button');
    back.className = 'adv-btn secondary';
    back.style.cssText = 'position:absolute;bottom:18px;left:14px;';
    back.textContent = '← Volver al mapa';
    back.addEventListener('click', function () { if (deps.onBack) deps.onBack(); });
    root.appendChild(back);

    dialogue.querySelector('[data-act="listen"]').addEventListener('click', function () {
      audio.speak(DIALOGUE.rina.greeting.join(' '));
    });
    dialogue.querySelector('[data-act="next"]').addEventListener('click', function () {
      audio.speak(DIALOGUE.rina.hint);
    });
  }

  function checkComplete() {
    if (found.length >= mission.collectibleCount) {
      progress.addStars(3);
      progress.addReward(mission.rewardId);
      progress.completeMission(mission.id);
      audio.speak('¡Misión completada! Recuperaste una página del Gran Libro.');
      if (onComplete) onComplete({ missionId: mission.id, rewardId: mission.rewardId, stars: 3 });
    }
  }

  function mount() {
    container.appendChild(root);
    render();
  }

  function destroy() {
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  return { mount: mount, destroy: destroy, render: render };
}
