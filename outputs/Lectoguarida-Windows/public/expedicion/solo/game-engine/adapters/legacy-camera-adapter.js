/**
 * legacy-camera-adapter.js
 * Bridges V2 CameraSystem to existing camera controller.
 * Reuses free camera, FOLLOW/FOCUS/OVERVIEW modes.
 */

export function createLegacyCameraAdapter(options) {
  var context = options.context;
  var cameraController = options.cameraController;
  var destroyed = false;

  function init() {
    if (!context || !context.eventBus) return;
    context.eventBus.on('camera:setMode', onSetMode);
    context.eventBus.on('camera:recenter', onRecenter);
    context.eventBus.on('camera:focus', onFocus);
  }

  function onSetMode(payload) {
    if (destroyed) return;
    var mode = payload && payload.mode;
    if (mode && cameraController && cameraController.setMode) {
      cameraController.setMode(mode);
    }
  }

  function onRecenter() {
    if (destroyed) return;
    if (cameraController && cameraController.recenter) {
      cameraController.recenter();
    }
  }

  function onFocus(payload) {
    if (destroyed) return;
    var target = payload && payload.target;
    if (target && cameraController && cameraController.focusOn) {
      cameraController.focusOn(target);
    }
  }

  // Called by CameraSystem to sync V2 camera target
  function updateCameraTarget(entityId) {
    if (destroyed) return;
    var transform = context.componentRegistry.getComponent(entityId, 'transform');
    var cameraTarget = context.componentRegistry.getComponent(entityId, 'cameraTarget');
    if (!transform || !cameraTarget) return;

    if (cameraController && cameraController.setTarget) {
      var offset = cameraTarget.offset || [0, 2, 5];
      cameraController.setTarget(
        transform.position[0] + offset[0],
        transform.position[1] + offset[1],
        transform.position[2] + offset[2]
      );
    }
  }

  function destroy() {
    destroyed = true;
    if (context && context.eventBus) {
      context.eventBus.off('camera:setMode', onSetMode);
      context.eventBus.off('camera:recenter', onRecenter);
      context.eventBus.off('camera:focus', onFocus);
    }
  }

  init();

  return {
    updateCameraTarget: updateCameraTarget,
    destroy: destroy
  };
}