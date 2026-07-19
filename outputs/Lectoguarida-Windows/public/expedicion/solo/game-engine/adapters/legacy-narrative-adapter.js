/**
 * legacy-narrative-adapter.js
 * Bridges V2 NarrativeSystem events to existing NarrativePanel, CaptionController, DialogueManager.
 * No new UI created — reuses legacy components.
 */

export function createLegacyNarrativeAdapter(options) {
  var context = options.context;
  var narrativePanel = options.narrativePanel;
  var captionController = options.captionController;
  var dialogueManager = options.dialogueManager;
  var destroyed = false;

  function init() {
    if (!context || !context.eventBus) return;
    context.eventBus.on('narrative:scene-started', onSceneStarted);
    context.eventBus.on('narrative:scene-ended', onSceneEnded);
    context.eventBus.on('dialogue:show', onDialogueShow);
    context.eventBus.on('dialogue:next', onDialogueNext);
    context.eventBus.on('dialogue:listen', onDialogueListen);
    context.eventBus.on('dialogue:repeat', onDialogueRepeat);
  }

  function onSceneStarted(payload) {
    if (destroyed) return;
    var sceneId = payload && payload.sceneId;
    if (sceneId && dialogueManager && dialogueManager.start) {
      dialogueManager.start(payload.lines || [], payload.speaker || '');
    }
    if (narrativePanel && narrativePanel.show) {
      narrativePanel.show(payload.speaker || '', payload.lines || [''], sceneId);
    }
  }

  function onSceneEnded(payload) {
    if (destroyed) return;
    if (narrativePanel && narrativePanel.hide) narrativePanel.hide();
    if (captionController && captionController.hide) captionController.hide();
  }

  function onDialogueShow(payload) {
    if (destroyed) return;
    var text = payload && payload.text;
    var speaker = payload && payload.speaker;
    if (captionController && captionController.show) {
      captionController.show(text, speaker);
    }
  }

  function onDialogueNext() {
    if (destroyed) return;
    if (dialogueManager && dialogueManager.next) dialogueManager.next();
  }

  function onDialogueListen(payload) {
    if (destroyed) return;
    var text = payload && payload.text;
    if (text && dialogueManager && dialogueManager.speak) dialogueManager.speak(text);
  }

  function onDialogueRepeat(payload) {
    if (destroyed) return;
    var text = payload && payload.text;
    if (text && dialogueManager && dialogueManager.repeat) dialogueManager.repeat(text);
  }

  function destroy() {
    destroyed = true;
    if (context && context.eventBus) {
      context.eventBus.off('narrative:scene-started', onSceneStarted);
      context.eventBus.off('narrative:scene-ended', onSceneEnded);
      context.eventBus.off('dialogue:show', onDialogueShow);
      context.eventBus.off('dialogue:next', onDialogueNext);
      context.eventBus.off('dialogue:listen', onDialogueListen);
      context.eventBus.off('dialogue:repeat', onDialogueRepeat);
    }
  }

  init();

  return {
    destroy: destroy
  };
}