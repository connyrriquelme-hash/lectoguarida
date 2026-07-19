/**
 * mission-manager.js
 * Orquesta el ciclo de la misión del Capítulo 1 (El eco de la laguna).
 */

import { CHAPTER_01 } from './adventure-config.js';
import { MISSION_COLLECTIBLES } from './data/collectibles.js';
import { DIALOGUE } from './data/dialogue-es-cl.js';

export function createMissionManager(deps) {
  var mission = CHAPTER_01.mission;
  var quest = deps.questManager;
  var audio = deps.audio;
  var onMissionComplete = deps.onMissionComplete;
  var onState = deps.onState;

  function startMission() {
    if (onState) onState('MISSION_INTRO');
    var lines = DIALOGUE.rina.greeting.slice();
    if (deps.dialogue) {
      deps.dialogue.start(lines, 'Rina');
    } else {
      audio.speak(lines.join(' '));
    }
  }

  function spawnCollectibles() {
    return MISSION_COLLECTIBLES.map(function (c) {
      return { id: c.id, kind: c.kind, word: c.word, position: c.position };
    });
  }

  function onCollectibleFound(id) {
    var isNew = quest.collect(id);
    if (isNew) {
      if (audio) audio.speak('¡Encontraste una campana!');
    }
    if (quest.isComplete()) {
      completeMission();
    }
    return isNew;
  }

  function completeMission() {
    if (onState) onState('MISSION_COMPLETE');
    if (deps.dialogue) deps.dialogue.start(DIALOGUE.rina.missionComplete, 'Rina');
    if (onMissionComplete) onMissionComplete({
      missionId: mission.id,
      rewardId: mission.rewardId,
      gameId: mission.gameId
    });
  }

  function collectibleCount() { return mission.collectibleCount; }

  return {
    mission: mission,
    startMission: startMission,
    spawnCollectibles: spawnCollectibles,
    onCollectibleFound: onCollectibleFound,
    collectibleCount: collectibleCount,
    isComplete: function () { return quest.isComplete(); }
  };
}
