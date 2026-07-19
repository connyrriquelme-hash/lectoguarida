/**
 * legacy-input-adapter.js
 * Bridges V2 InputSystem to existing joystick, WASD, click-to-move.
 * Reuses existing mobile-controls.js and input-controller.js logic.
 */

export function createLegacyInputAdapter(options) {
  var context = options.context;
  var joystick = options.joystick;
  var wasd = options.wasd;
  var clickToMove = options.clickToMove;
  var destroyed = false;

  function init() {
    if (!context || !context.systemManager) return;
    var inputSystem = context.systemManager.getSystem('InputSystem');
    if (!inputSystem) return;

    // Listen to V2 input events and forward to legacy controllers
    if (context.eventBus) {
      context.eventBus.on('input:move', onMove);
      context.eventBus.on('input:interact', onInteract);
    }
  }

  function onMove(payload) {
    if (destroyed) return;
    var dir = payload && payload.direction;
    if (!dir) return;

    // Update legacy player controller via context
    var playerEntity = getPlayerEntity();
    if (playerEntity) {
      var mv = context.componentRegistry.getComponent(playerEntity, 'movement');
      if (mv) {
        mv.direction = [dir.x, 0, dir.z];
        mv.enabled = true;
      }
    }
  }

  function onInteract() {
    if (destroyed) return;
    var playerEntity = getPlayerEntity();
    if (playerEntity) {
      var interaction = context.componentRegistry.getComponent(playerEntity, 'interaction');
      if (interaction && context.eventBus) {
        context.eventBus.emit('player:interacted', {
          entityId: playerEntity,
          actionId: interaction.actionId,
          prompt: interaction.prompt
        });
      }
    }
  }

  function getPlayerEntity() {
    var entities = context.entityManager.queryComponents('cameraTarget');
    return entities.length > 0 ? entities[0].entityId : null;
  }

  // Called by legacy mobile controls / input controller
  function handleJoystick(vector) {
    if (destroyed || !context || !context.eventBus) return;
    context.eventBus.emit('input:move', { direction: vector });
  }

  function handleKeyboard(keys) {
    if (destroyed || !context || !context.eventBus) return;
    var dir = { x: 0, z: 0 };
    if (keys.KeyW || keys.ArrowUp) dir.z -= 1;
    if (keys.KeyS || keys.ArrowDown) dir.z += 1;
    if (keys.KeyA || keys.ArrowLeft) dir.x -= 1;
    if (keys.KeyD || keys.ArrowRight) dir.x += 1;
    if (dir.x !== 0 || dir.z !== 0) {
      context.eventBus.emit('input:move', { direction: dir });
    }
  }

  function handleClick(position) {
    if (destroyed || !context || !context.eventBus) return;
    context.eventBus.emit('input:click', { position: position });
  }

  function destroy() {
    destroyed = true;
    if (context && context.eventBus) {
      context.eventBus.off('input:move', onMove);
      context.eventBus.off('input:interact', onInteract);
    }
  }

  init();

  return {
    handleJoystick: handleJoystick,
    handleKeyboard: handleKeyboard,
    handleClick: handleClick,
    destroy: destroy
  };
}