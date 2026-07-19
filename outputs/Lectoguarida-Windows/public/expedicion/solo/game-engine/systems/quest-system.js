/**
 * quest-system.js
 * Manages quest state, objectives, and challenge triggering.
 */

import { COMPONENTS } from '../components/components.js';

export function createQuestSystem() {
  var activeQuest = null;
  var objectives = {};

  return {
    componentId: 'QuestSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var targets = registry.query(COMPONENTS.QUEST_TARGET);
      for (var i = 0; i < targets.length; i++) {
        var qt = targets[i];
        if (qt.state === 'completed') continue;
        if (activeQuest && qt.questId === activeQuest.id) {
          // Check objective completion
        }
      }
    },

    startQuest: function (questId, context) {
      activeQuest = { id: questId, objectives: [] };
      context.eventBus.emit('quest:started', { questId: questId });
    },

    completeObjective: function (objectiveId, context) {
      if (!activeQuest) return;
      activeQuest.objectives.push(objectiveId);
      context.eventBus.emit('quest:objective-complete', { questId: activeQuest.id, objectiveId: objectiveId });
    },

    triggerChallenge: function (gameId, missionId, context) {
      context.eventBus.emit('quest:challenge', {
        gameId: gameId,
        missionId: missionId
      });
    },

    getActiveQuest: function () { return activeQuest; }
  };
}